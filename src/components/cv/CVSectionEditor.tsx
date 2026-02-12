'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ComprehensiveCV, CVSection } from '@/lib/types';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface CVSectionEditorProps {
    cv: ComprehensiveCV;
    section: CVSection;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: Partial<ComprehensiveCV>) => Promise<void>;
}

export function CVSectionEditor({
    cv,
    section,
    isOpen,
    onClose,
    onSave
}: CVSectionEditorProps) {
    const t = useTranslations('cv');
    const [isSaving, setIsSaving] = useState(false);

    // Local state for the section being edited
    // We initialize it once when the component is mounted for a specific section
    const [localData, setLocalData] = useState<any>(cv[section] || []);
    const [newSkill, setNewSkill] = useState('');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({ [section]: localData });
            onClose();
        } catch (error) {
            console.error('Failed to save section:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const renderPersonalInfo = () => (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>{t('full_name')}</Label>
                <Input
                    value={localData.full_name || ''}
                    onChange={e => setLocalData({ ...localData, full_name: e.target.value })}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>{t('email')}</Label>
                    <Input
                        value={localData.email || ''}
                        onChange={e => setLocalData({ ...localData, email: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>{t('phone')}</Label>
                    <Input
                        value={localData.phone || ''}
                        onChange={e => setLocalData({ ...localData, phone: e.target.value })}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>{t('location')}</Label>
                <Input
                    value={localData.location || ''}
                    onChange={e => setLocalData({ ...localData, location: e.target.value })}
                />
            </div>
            <div className="space-y-2">
                <Label>{t('summary')}</Label>
                <Textarea
                    value={localData.summary || ''}
                    onChange={e => setLocalData({ ...localData, summary: e.target.value })}
                    rows={6}
                />
            </div>
        </div>
    );

    const renderWorkExperience = () => {
        const experiences = Array.isArray(localData) ? localData : [];

        const updateExp = (index: number, updates: any) => {
            const newExps = [...experiences];
            newExps[index] = { ...newExps[index], ...updates };
            setLocalData(newExps);
        };

        const addExp = () => {
            setLocalData([...experiences, {
                id: crypto.randomUUID(),
                job_title: '',
                company: '',
                start_date: '',
                description: '',
                achievements: []
            }]);
        };

        const removeExp = (index: number) => {
            setLocalData(experiences.filter((_, i) => i !== index));
        };

        return (
            <div className="space-y-6 py-4">
                {experiences.map((exp, idx) => (
                    <div key={exp.id || idx} className="p-4 border rounded-lg space-y-4 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 text-destructive"
                            onClick={() => removeExp(idx)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('job_title')}</Label>
                                <Input value={exp.job_title} onChange={e => updateExp(idx, { job_title: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('company')}</Label>
                                <Input value={exp.company} onChange={e => updateExp(idx, { company: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('description')}</Label>
                            <Textarea value={exp.description} onChange={e => updateExp(idx, { description: e.target.value })} />
                        </div>
                    </div>
                ))}
                <Button variant="outline" className="w-full" onClick={addExp}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('add_experience')}
                </Button>
            </div>
        );
    };

    const renderEducation = () => {
        const educations = Array.isArray(localData) ? localData : [];

        const updateEdu = (index: number, updates: any) => {
            const newEdus = [...educations];
            newEdus[index] = { ...newEdus[index], ...updates };
            setLocalData(newEdus);
        };

        const addEdu = () => {
            setLocalData([...educations, {
                id: crypto.randomUUID(),
                degree: '',
                institution: '',
                field_of_study: '',
                start_date: ''
            }]);
        };

        const removeEdu = (index: number) => {
            setLocalData(educations.filter((_, i) => i !== index));
        };

        return (
            <div className="space-y-6 py-4">
                {educations.map((edu, idx) => (
                    <div key={edu.id || idx} className="p-4 border rounded-lg space-y-4 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 text-destructive"
                            onClick={() => removeEdu(idx)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('degree')}</Label>
                                <Input value={edu.degree} onChange={e => updateEdu(idx, { degree: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('institution')}</Label>
                                <Input value={edu.institution} onChange={e => updateEdu(idx, { institution: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('field_of_study')}</Label>
                            <Input value={edu.field_of_study} onChange={e => updateEdu(idx, { field_of_study: e.target.value })} />
                        </div>
                    </div>
                ))}
                <Button variant="outline" className="w-full" onClick={addEdu}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('add_education')}
                </Button>
            </div>
        );
    };

    const renderSkills = () => {
        const skills = Array.isArray(localData) ? localData : [];

        const addSkill = (e?: React.FormEvent) => {
            e?.preventDefault();
            if (newSkill.trim() && !skills.includes(newSkill.trim())) {
                setLocalData([...skills, newSkill.trim()]);
                setNewSkill('');
            }
        };

        const removeSkill = (index: number) => {
            setLocalData(skills.filter((_, i) => i !== index));
        };

        return (
            <div className="space-y-4 py-4">
                <form onSubmit={addSkill} className="flex gap-2">
                    <Input
                        placeholder={t('add_skill')}
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                    />
                    <Button type="button" size="sm" onClick={addSkill}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </form>
                <div className="flex flex-wrap gap-2">
                    {skills.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="px-2 py-1 gap-1">
                            {skill}
                            <button onClick={() => removeSkill(idx)} className="hover:text-destructive">
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            </div>
        );
    };

    const renderProjects = () => {
        const projects = Array.isArray(localData) ? localData : [];

        const updateProj = (index: number, updates: any) => {
            const newProjs = [...projects];
            newProjs[index] = { ...newProjs[index], ...updates };
            setLocalData(newProjs);
        };

        const addProj = () => {
            setLocalData([...projects, {
                id: crypto.randomUUID(),
                name: '',
                description: '',
                technologies: []
            }]);
        };

        const removeProj = (index: number) => {
            setLocalData(projects.filter((_, i) => i !== index));
        };

        return (
            <div className="space-y-6 py-4">
                {projects.map((proj, idx) => (
                    <div key={proj.id || idx} className="p-4 border rounded-lg space-y-4 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 text-destructive"
                            onClick={() => removeProj(idx)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="space-y-2">
                            <Label>{t('project_name')}</Label>
                            <Input value={proj.name} onChange={e => updateProj(idx, { name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('project_description')}</Label>
                            <Textarea value={proj.description} onChange={e => updateProj(idx, { description: e.target.value })} />
                        </div>
                    </div>
                ))}
                <Button variant="outline" className="w-full" onClick={addProj}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('add_project')}
                </Button>
            </div>
        );
    };

    const renderGeneric = () => (
        <div className="py-20 text-center animate-pulse">
            Editing {section} is coming soon...
        </div>
    );

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-xl overflow-y-auto w-full">
                <SheetHeader>
                    <SheetTitle>{t(section as any) || section}</SheetTitle>
                    <SheetDescription>
                        Edit your {section.replace('_', ' ')} details below.
                    </SheetDescription>
                </SheetHeader>

                <div className="min-h-[300px]">
                    {section === 'personal_info' && renderPersonalInfo()}
                    {section === 'work_experience' && renderWorkExperience()}
                    {section === 'education' && renderEducation()}
                    {section === 'skills' && renderSkills()}
                    {section === 'projects' && renderProjects()}
                    {section !== 'personal_info' && section !== 'work_experience' &&
                        section !== 'education' && section !== 'skills' && section !== 'projects' &&
                        renderGeneric()}
                </div>

                <SheetFooter className="mt-6">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {t('save')}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
