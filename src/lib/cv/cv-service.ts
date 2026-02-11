import { SupabaseClient } from '@supabase/supabase-js';
import { ComprehensiveCV } from '@/lib/types';

export class CVService {
    constructor(private supabase: SupabaseClient) { }

    async getCV(userId: string): Promise<ComprehensiveCV | null> {
        const { data, error } = await this.supabase
            .from('comprehensive_cvs')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned - CV doesn't exist
                return null;
            }
            throw error;
        }

        return this.mapDatabaseToCV(data);
    }

    async createCV(userId: string, cv: Partial<ComprehensiveCV>): Promise<ComprehensiveCV> {
        const dbData = this.mapCVToDatabase(userId, cv);

        const { data, error } = await this.supabase
            .from('comprehensive_cvs')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;
        return this.mapDatabaseToCV(data);
    }

    async updateCV(userId: string, cv: Partial<ComprehensiveCV>): Promise<ComprehensiveCV> {
        const dbData = this.mapCVToDatabase(userId, cv);

        const { data, error } = await this.supabase
            .from('comprehensive_cvs')
            .update(dbData)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return this.mapDatabaseToCV(data);
    }

    async upsertCV(userId: string, cv: Partial<ComprehensiveCV>): Promise<ComprehensiveCV> {
        const dbData = this.mapCVToDatabase(userId, cv);

        const { data, error } = await this.supabase
            .from('comprehensive_cvs')
            .upsert(dbData, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;
        return this.mapDatabaseToCV(data);
    }

    async deleteCV(userId: string): Promise<void> {
        const { error } = await this.supabase
            .from('comprehensive_cvs')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    }

    async updateCVField(
        userId: string,
        fieldPath: string,
        value: any
    ): Promise<ComprehensiveCV> {
        // Get current CV
        const currentCV = await this.getCV(userId);
        if (!currentCV) {
            throw new Error('CV not found');
        }

        // Update the specific field
        const updatedCV = this.setNestedValue(currentCV, fieldPath, value);

        // Save back to database
        return this.updateCV(userId, updatedCV);
    }

    // Helper: Map database row to ComprehensiveCV type
    private mapDatabaseToCV(row: any): ComprehensiveCV {
        return {
            id: row.id,
            user_id: row.user_id,
            personal_info: row.personal_info || {},
            work_experience: row.work_experience || [],
            education: row.education || [],
            skills: row.skills || [],
            certifications: row.certifications || [],
            languages: row.languages || [],
            projects: row.projects || [],
            additional_sections: row.additional_sections || [],
            raw_text: row.raw_text || '',
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }

    // Helper: Map ComprehensiveCV to database format
    private mapCVToDatabase(userId: string, cv: Partial<ComprehensiveCV>): any {
        return {
            user_id: userId,
            personal_info: cv.personal_info || {},
            work_experience: cv.work_experience || [],
            education: cv.education || [],
            skills: cv.skills || [],
            certifications: cv.certifications || [],
            languages: cv.languages || [],
            projects: cv.projects || [],
            additional_sections: cv.additional_sections || [],
            raw_text: cv.raw_text || '',
        };
    }

    // Helper: Set nested object value by path string
    private setNestedValue(obj: any, path: string, value: any): any {
        const clone = JSON.parse(JSON.stringify(obj));
        const keys = path.split('.');
        let current = clone;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
        return clone;
    }
}

// Factory function
export function createCVService(supabase: SupabaseClient): CVService {
    return new CVService(supabase);
}
