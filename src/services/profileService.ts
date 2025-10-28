import { Profile, ProfileSystem, DietaryRestriction, UserProfile, SeverityLevel } from '@/types/restrictions';
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
      const profiles = await this.getProfiles();
      if (profiles.length === 0) {
        await this.createDefaultProfile();
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
      // Check local storage directly (not async getProfiles)
      const localData = localStorage.getItem(this.STORAGE_KEY);
      if (localData) {
        const system: ProfileSystem = JSON.parse(localData);
        if (system.profiles && system.profiles.length > 0) {
          await this.migrateLocalToCloud();
          return;
        }
      }
      // Create default profile in cloud
      await this.createCloudProfile('Mi Perfil');
    }
  }

  static async migrateLocalToCloud(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Read directly from localStorage (not async)
      const localData = localStorage.getItem(this.STORAGE_KEY);
      if (!localData) return;
      
      const system: ProfileSystem = JSON.parse(localData);
      const localProfiles = system.profiles || [];
      
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

        // Insert restrictions con severidad
        const restrictionsToInsert = profile.restrictions
          .filter(r => r.enabled)
          .map(r => ({
            profile_id: newProfile.id,
            restriction_id: r.id,
            enabled: true,
            severity_level: r.severityLevel || 'moderado'
          }));

        if (restrictionsToInsert.length > 0) {
          await supabase
            .from('profile_restrictions')
            .insert(restrictionsToInsert);
        }

        // Insert custom restrictions con severidad
        const customToInsert = profile.customRestrictions.map(cr => {
          const text = typeof cr === 'string' ? cr : cr.text;
          const severityLevel = typeof cr === 'object' ? cr.severityLevel : 'moderado';
          return {
            profile_id: newProfile.id,
            restriction_text: text,
            severity_level: severityLevel
          };
        });

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

  static async getProfiles(): Promise<Profile[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // FREE MODE: usar localStorage
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return [];
        const system: ProfileSystem = JSON.parse(data);
        return system.profiles || [];
      }
      
      // PREMIUM MODE: cargar desde Supabase
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          *,
          profile_restrictions (
            restriction_id,
            enabled,
            severity_level
          ),
          profile_custom_restrictions (
            restriction_text,
            severity_level
          )
        `)
        .order('created_at', { ascending: true });
      
      if (!profiles) return [];
      
      // Transformar datos de Supabase a formato Profile
      return profiles.map(p => this.transformSupabaseToProfile(p));
    } catch (error) {
      console.error('Error loading profiles:', error);
      return [];
    }
  }

  static async getActiveProfiles(): Promise<Profile[]> {
    const profiles = await this.getProfiles();
    return profiles.filter(p => p.isActive);
  }

  static async getProfile(id: string): Promise<Profile | undefined> {
    const profiles = await this.getProfiles();
    return profiles.find(p => p.id === id);
  }

  private static transformSupabaseToProfile(supabaseProfile: any): Profile {
    const availableRestrictions = defaultRestrictions;
    
    // Crear mapa de restricciones habilitadas con severidad
    const restrictionsMap = new Map<string, string>(
      (supabaseProfile.profile_restrictions || []).map((r: any) => [
        r.restriction_id,
        r.severity_level || 'moderado'
      ])
    );
    
    return {
      id: supabaseProfile.id,
      name: supabaseProfile.name,
      isActive: supabaseProfile.is_active,
      restrictions: availableRestrictions.map(r => ({
        ...r,
        enabled: restrictionsMap.has(r.id),
        severityLevel: (restrictionsMap.get(r.id) || 'moderado') as SeverityLevel
      })),
      customRestrictions: (supabaseProfile.profile_custom_restrictions || []).map(
        (c: any) => ({
          text: c.restriction_text,
          severityLevel: (c.severity_level || 'moderado') as SeverityLevel
        })
      ),
      createdAt: supabaseProfile.created_at
    };
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

  static async createProfile(name: string): Promise<Profile> {
    const isPremium = await this.isPremium();
    const profiles = await this.getProfiles();
    
    const maxProfiles = isPremium ? this.MAX_PROFILES_PREMIUM : this.MAX_PROFILES_FREE;
    if (profiles.length >= maxProfiles) {
      throw new Error(isPremium ? `Máximo ${maxProfiles} perfiles alcanzado` : `Regístrate para crear más perfiles`);
    }

    if (!name.trim()) {
      throw new Error('El nombre del perfil no puede estar vacío');
    }

    if (profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Ya existe un perfil con ese nombre');
    }

    if (isPremium) {
      // PREMIUM: crear en Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          name: name.trim(),
          is_active: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Recargar para obtener el perfil completo
      const updatedProfiles = await this.getProfiles();
      return updatedProfiles.find(p => p.id === data.id)!;
    } else {
      // FREE: crear en localStorage
      const availableRestrictions = defaultRestrictions.filter(r => r.isFree === true);
      const newProfile: Profile = {
        id: crypto.randomUUID(),
        name: name.trim(),
        isActive: false,
        restrictions: availableRestrictions.map(r => ({ ...r, enabled: false })),
        customRestrictions: [],
        createdAt: new Date().toISOString()
      };

      profiles.push(newProfile);
      this.saveProfiles(profiles);
      return newProfile;
    }
  }

  static async updateProfile(id: string, updates: Partial<Omit<Profile, 'id' | 'createdAt'>>): Promise<void> {
    const isPremium = await this.isPremium();
    
    if (!isPremium) {
      // FREE: actualizar localStorage
      const profiles = await this.getProfiles();
      const index = profiles.findIndex(p => p.id === id);
      
      if (index === -1) throw new Error('Perfil no encontrado');
      
      if (updates.name !== undefined && updates.name.trim() === '') {
        throw new Error('El nombre del perfil no puede estar vacío');
      }

      if (updates.name !== undefined && updates.name !== profiles[index].name) {
        const nameExists = profiles.some((p, i) => 
          i !== index && p.name.toLowerCase() === updates.name!.toLowerCase()
        );
        if (nameExists) throw new Error('Ya existe un perfil con ese nombre');
      }

      profiles[index] = {
        ...profiles[index],
        ...updates,
        name: updates.name?.trim() || profiles[index].name
      };

      this.saveProfiles(profiles);
      return;
    }

    // PREMIUM: actualizar en Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Validar nombre si está en updates
    if (updates.name !== undefined) {
      if (updates.name.trim() === '') {
        throw new Error('El nombre del perfil no puede estar vacío');
      }

      const profiles = await this.getProfiles();
      const nameExists = profiles.some(p => 
        p.id !== id && p.name.toLowerCase() === updates.name!.toLowerCase()
      );
      if (nameExists) throw new Error('Ya existe un perfil con ese nombre');
    }

    // Actualizar nombre en Supabase si cambió
    if (updates.name !== undefined) {
      await supabase
        .from('profiles')
        .update({ name: updates.name.trim() })
        .eq('id', id)
        .eq('user_id', user.id);
    }

    // Actualizar restricciones si cambiaron
    if (updates.restrictions) {
      const enabledRestrictions = updates.restrictions.filter(r => r.enabled);
      
      // Borrar restricciones existentes
      await supabase
        .from('profile_restrictions')
        .delete()
        .eq('profile_id', id);
      
      // Insertar nuevas restricciones habilitadas con severidad
      if (enabledRestrictions.length > 0) {
        await supabase
          .from('profile_restrictions')
          .insert(
            enabledRestrictions.map(r => ({
              profile_id: id,
              restriction_id: r.id,
              enabled: true,
              severity_level: r.severityLevel || 'moderado'
            }))
          );
      }
    }

    // Actualizar restricciones personalizadas si cambiaron
    if (updates.customRestrictions) {
      // Borrar restricciones personalizadas existentes
      await supabase
        .from('profile_custom_restrictions')
        .delete()
        .eq('profile_id', id);
      
      // Insertar nuevas restricciones personalizadas con severidad
      if (updates.customRestrictions.length > 0) {
        await supabase
          .from('profile_custom_restrictions')
          .insert(
            updates.customRestrictions.map(cr => ({
              profile_id: id,
              restriction_text: cr.text,
              severity_level: cr.severityLevel
            }))
          );
      }
    }
  }

  static async deleteProfile(id: string): Promise<void> {
    const isPremium = await this.isPremium();
    const profiles = await this.getProfiles();
    
    if (profiles.length <= 1) {
      throw new Error('Debes tener al menos un perfil');
    }

    if (!isPremium) {
      // FREE: eliminar de localStorage
      const filtered = profiles.filter(p => p.id !== id);
      if (filtered.length === 0) {
        await this.createDefaultProfile();
      } else {
        this.saveProfiles(filtered);
      }
      return;
    }

    // PREMIUM: eliminar de Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  static async toggleProfileActive(id: string): Promise<boolean> {
    const isPremium = await this.isPremium();
    const profiles = await this.getProfiles();
    const profile = profiles.find(p => p.id === id);
    
    if (!profile) throw new Error('Perfil no encontrado');

    const newActiveState = !profile.isActive;

    if (!isPremium) {
      // FREE: actualizar localStorage
      profile.isActive = newActiveState;
      this.saveProfiles(profiles);
      return newActiveState;
    }

    // PREMIUM: actualizar en Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: newActiveState })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    
    return newActiveState;
  }

  static async canCreateProfile(): Promise<boolean> {
    const isPremium = await this.isPremium();
    const profiles = await this.getProfiles();
    const maxProfiles = isPremium ? this.MAX_PROFILES_PREMIUM : this.MAX_PROFILES_FREE;
    return profiles.length < maxProfiles;
  }

  private static saveProfiles(profiles: Profile[]): void {
    const system: ProfileSystem = {
      profiles,
      version: this.VERSION
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(system));
  }

  private static async createDefaultProfile(): Promise<void> {
    const isPremium = await this.isPremium();
    
    // Premium users get ALL restrictions, free users get only allergens
    const availableRestrictions = isPremium 
      ? defaultRestrictions 
      : defaultRestrictions.filter(r => r.isFree === true);

    const defaultProfile: Profile = {
      id: crypto.randomUUID(),
      name: 'Mi Perfil',
      isActive: true,
      restrictions: availableRestrictions.map(r => ({ ...r, enabled: false })),
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
        restrictions: (oldProfile.restrictions || defaultRestrictions
          .filter(r => r.isFree === true)
          .map(r => ({ ...r, enabled: false }))).map(r => ({
            ...r,
            severityLevel: r.severityLevel || 'moderado'
          })),
        customRestrictions: (oldProfile.customRestrictions || []).map(cr => 
          typeof cr === 'string' ? { text: cr, severityLevel: 'moderado' as const } : cr
        ),
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
