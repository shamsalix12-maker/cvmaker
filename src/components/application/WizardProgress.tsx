'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
    id: string;
    label: string;
}

interface WizardProgressProps {
    steps: Step[];
    currentStep: number;
    className?: string;
}

export function WizardProgress({ steps, currentStep, className }: WizardProgressProps) {
    const t = useTranslations('application');

    return (
        <div className={cn("w-full py-4", className)}>
            <div className="relative flex justify-between">
                {/* Connector Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
                <div
                    className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500 ease-in-out"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isActive = index <= currentStep;
                    const isCurrent = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300",
                                    isCurrent ? "bg-background border-primary scale-110 shadow-lg shadow-primary/20" :
                                        isCompleted ? "bg-primary border-primary" :
                                            "bg-muted border-muted text-muted-foreground"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-5 w-5 text-primary-foreground" />
                                ) : (
                                    <span className={cn("font-bold text-sm", isCurrent ? "text-primary" : "")}>
                                        {index + 1}
                                    </span>
                                )}
                            </div>
                            <span
                                className={cn(
                                    "mt-2 text-[10px] font-bold uppercase tracking-widest hidden sm:block transition-colors duration-300",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
