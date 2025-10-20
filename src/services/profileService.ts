import { Profile, ProfileSystem, DietaryRestriction, UserProfile } from '@/types/restrictions';
import { defaultRestrictions } from '@/data/restrictions';

export class ProfileService {
  private static STORAGE_KEY = 'labelGuardProfiles';
  private static LEGACY_KEY = 'foodFreedomProfile';
  private static MAX_PROFILES = 5;
  private static VERSION = '2.0';

  static initialize(): void {
    this.migrateOldData();
    const profiles = this.getProfiles();
    if (profiles.length === 0) {
      this.createDefaultProfile();
    }
  }

  static getProfiles(): Profile[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      
      const system: ProfileSystem = JSON.parse(data);
      return system.profiles || [];
    } catch (error) {
      console.error('Error loading profiles:', error);
      return [];
    }
  }

  static getActiveProfiles(): Profile[] {
    return this.getProfiles().filter(p => p.isActive);
  }

  static getProfile(id: string): Profile | undefined {
    return this.getProfiles().find(p => p.id === id);
  }

  static createProfile(name: string): Profile {
    const profiles = this.getProfiles();
    
    if (profiles.length >= this.MAX_PROFILES) {
      throw new Error(`Máximo ${this.MAX_PROFILES} perfiles permitidos`);
    }

    if (!name.trim()) {
      throw new Error('El nombre del perfil no puede estar vacío');
    }

    if (profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Ya existe un perfil con ese nombre');
    }

    const newProfile: Profile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      isActive: false,
      restrictions: defaultRestrictions.map(r => ({ ...r, enabled: false })),
      customRestrictions: [],
      createdAt: new Date().toISOString()
    };

    profiles.push(newProfile);
    this.saveProfiles(profiles);
    
    return newProfile;
  }

  static updateProfile(id: string, updates: Partial<Omit<Profile, 'id' | 'createdAt'>>): void {
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Perfil no encontrado');
    }

    if (updates.name !== undefined && updates.name.trim() === '') {
      throw new Error('El nombre del perfil no puede estar vacío');
    }

    if (updates.name !== undefined && updates.name !== profiles[index].name) {
      const nameExists = profiles.some((p, i) => 
        i !== index && p.name.toLowerCase() === updates.name!.toLowerCase()
      );
      if (nameExists) {
        throw new Error('Ya existe un perfil con ese nombre');
      }
    }

    profiles[index] = {
      ...profiles[index],
      ...updates,
      name: updates.name?.trim() || profiles[index].name
    };

    this.saveProfiles(profiles);
  }

  static deleteProfile(id: string): void {
    const profiles = this.getProfiles();
    
    if (profiles.length <= 1) {
      throw new Error('Debes tener al menos un perfil');
    }

    const filtered = profiles.filter(p => p.id !== id);
    
    if (filtered.length === 0) {
      this.createDefaultProfile();
    } else {
      this.saveProfiles(filtered);
    }
  }

  static toggleProfileActive(id: string): boolean {
    const profiles = this.getProfiles();
    const profile = profiles.find(p => p.id === id);
    
    if (!profile) {
      throw new Error('Perfil no encontrado');
    }

    profile.isActive = !profile.isActive;
    this.saveProfiles(profiles);
    
    return profile.isActive;
  }

  static canCreateProfile(): boolean {
    return this.getProfiles().length < this.MAX_PROFILES;
  }

  static getMaxProfiles(): number {
    return this.MAX_PROFILES;
  }

  private static saveProfiles(profiles: Profile[]): void {
    const system: ProfileSystem = {
      profiles,
      version: this.VERSION
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(system));
  }

  private static createDefaultProfile(): void {
    const defaultProfile: Profile = {
      id: crypto.randomUUID(),
      name: 'Mi Perfil',
      isActive: true,
      restrictions: defaultRestrictions.map(r => ({ ...r, enabled: false })),
      customRestrictions: [],
      createdAt: new Date().toISOString()
    };

    this.saveProfiles([defaultProfile]);
  }

  static migrateOldData(): void {
    const oldData = localStorage.getItem(this.LEGACY_KEY);
    const newData = localStorage.getItem(this.STORAGE_KEY);
    
    if (oldData && !newData) {
      try {
        const oldProfile: UserProfile = JSON.parse(oldData);
        
        const migratedProfile: Profile = {
          id: crypto.randomUUID(),
          name: 'Mi Perfil',
          isActive: true,
          restrictions: oldProfile.restrictions || defaultRestrictions.map(r => ({ ...r, enabled: false })),
          customRestrictions: oldProfile.customRestrictions || [],
          createdAt: new Date().toISOString()
        };

        const system: ProfileSystem = {
          profiles: [migratedProfile],
          version: this.VERSION
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(system));
        localStorage.removeItem(this.LEGACY_KEY);
        
        console.log('✅ Datos migrados exitosamente a LabelGuard');
      } catch (error) {
        console.error('❌ Error en migración:', error);
      }
    }
  }
}
