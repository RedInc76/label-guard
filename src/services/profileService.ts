import { Profile, ProfileSystem, DietaryRestriction, UserProfile } from '@/types/restrictions';
import { defaultRestrictions } from '@/data/restrictions';
import { supabase } from '@/integrations/supabase/client';

export class ProfileService {
  private static STORAGE_KEY = 'labelGuardProfiles';
  private static LEGACY_KEY = 'foodFreedomProfile';
  private static MAX_PROFILES_FREE = 1;
  private static MAX_PROFILES_PREMIUM = 5;
  private static VERSION = '2.0';

  static async initialize(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // FREE MODE: inicializar localStorage
      this.migrateOldData();
      const profiles = this.getProfiles();
      if (profiles.length === 0) {
        this.createDefaultProfile();
      }
    } else {
      // PREMIUM MODE: cargar desde Supabase
      await this.initializePremiumMode();
    }
  }

  static async initializePremiumMode(): Promise<void> {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*');
    
    // If no profiles in Supabase but has local data, migrate it
    if (!profiles || profiles.length === 0) {
      const localProfiles = this.getProfiles();
      if (localProfiles.length > 0) {
        await this.migrateLocalToCloud();
      } else {
        // Create default profile in cloud
        await this.createCloudProfile('Mi Perfil');
      }
    }
  }

  static async migrateLocalToCloud(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const localProfiles = this.getProfiles();
      
      for (const profile of localProfiles) {
        // Create profile in Supabase
        const { data: newProfile, error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            name: profile.name,
            is_active: profile.isActive,
          })
          .select()
          .single();

        if (error || !newProfile) {
          console.error('Error creating profile:', error);
          continue;
        }

        // Insert restrictions
        const restrictionsToInsert = profile.restrictions
          .filter(r => r.enabled)
          .map(r => ({
            profile_id: newProfile.id,
            restriction_id: r.id,
            enabled: true,
          }));

        if (restrictionsToInsert.length > 0) {
          await supabase
            .from('profile_restrictions')
            .insert(restrictionsToInsert);
        }

        // Insert custom restrictions
        const customToInsert = profile.customRestrictions.map(text => ({
          profile_id: newProfile.id,
          restriction_text: text,
        }));

        if (customToInsert.length > 0) {
          await supabase
            .from('profile_custom_restrictions')
            .insert(customToInsert);
        }
      }

      // Clear local storage after successful migration
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ Profiles migrated to cloud successfully');
    } catch (error) {
      console.error('❌ Error migrating to cloud:', error);
    }
  }

  static async createCloudProfile(name: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        name: name.trim(),
        is_active: true,
      });

    if (error) {
      console.error('Error creating cloud profile:', error);
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

  static async isPremium(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  }

  static async getAvailableRestrictions(): Promise<DietaryRestriction[]> {
    const premium = await this.isPremium();
    if (premium) {
      return defaultRestrictions; // All 26 restrictions
    } else {
      // Only allergens (11 restrictions with isFree: true)
      return defaultRestrictions.filter(r => r.isFree === true);
    }
  }

  static async getMaxProfiles(): Promise<number> {
    const premium = await this.isPremium();
    return premium ? this.MAX_PROFILES_PREMIUM : this.MAX_PROFILES_FREE;
  }

  static createProfile(name: string): Profile {
    const profiles = this.getProfiles();
    
    if (profiles.length >= this.MAX_PROFILES_FREE) {
      throw new Error(`Regístrate para crear más perfiles`);
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
      restrictions: defaultRestrictions
        .filter(r => r.isFree === true)
        .map(r => ({ ...r, enabled: false })),
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
    return this.getProfiles().length < this.MAX_PROFILES_FREE;
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
      restrictions: defaultRestrictions
        .filter(r => r.isFree === true)
        .map(r => ({ ...r, enabled: false })),
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
          restrictions: oldProfile.restrictions || defaultRestrictions
            .filter(r => r.isFree === true)
            .map(r => ({ ...r, enabled: false })),
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
