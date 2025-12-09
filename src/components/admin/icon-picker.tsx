'use client';

import {
    MapPin, Star, Route, UtensilsCrossed, Pizza, Truck, Clock, Shield,
    Heart, User, Settings, Phone, Mail, Info, Check, X, AlertCircle,
    Award, Gift, Zap, Activity, TrendingUp, ThumbsUp, Smile, Coffee,
    Utensils, ChefHat, ShoppingBag, CreditCard, DollarSign, Percent,
    HelpCircle, CircleHelp, Lock, Key, ShieldCheck, ShieldAlert, ShieldX,
    UserCheck, UserPlus, UserMinus, Users, UserCog, Briefcase, Building,
    Building2, Landmark, Gavel, Scale, FileText, FileCheck, FileBadge,
    BadgeCheck, BadgeAlert, BadgeInfo, BadgePlus, BadgeMinus, BadgeX,
    Medal, Trophy, Crown, Gem, Diamond, Sparkles, Lightbulb, Brain,
    Rocket, Target, Crosshair, Eye, EyeOff, View, Scan, ScanFace,
    Fingerprint, Accessibility, Ear, Hand, HandMetal, Handshake,
    HeartHandshake, ThumbsDown, SmilePlus, Angry, Frown, Meh,
    Glasses, GraduationCap, School, Book, BookOpen, Library
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// Map of icons
const Icons: Record<string, any> = {
    MapPin, Star, Route, UtensilsCrossed, Pizza, Truck, Clock, Shield,
    Heart, User, Settings, Phone, Mail, Info, Check, X, AlertCircle,
    Award, Gift, Zap, Activity, TrendingUp, ThumbsUp, Smile, Coffee,
    Utensils, ChefHat, ShoppingBag, CreditCard, DollarSign, Percent,
    HelpCircle, CircleHelp, Lock, Key, ShieldCheck, ShieldAlert, ShieldX,
    UserCheck, UserPlus, UserMinus, Users, UserCog, Briefcase, Building,
    Building2, Landmark, Gavel, Scale, FileText, FileCheck, FileBadge,
    BadgeCheck, BadgeAlert, BadgeInfo, BadgePlus, BadgeMinus, BadgeX,
    Medal, Trophy, Crown, Gem, Diamond, Sparkles, Lightbulb, Brain,
    Rocket, Target, Crosshair, Eye, EyeOff, View, Scan, ScanFace,
    Fingerprint, Accessibility, Ear, Hand, HandMetal, Handshake,
    HeartHandshake, ThumbsDown, SmilePlus, Angry, Frown, Meh,
    Glasses, GraduationCap, School, Book, BookOpen, Library
};

const ICON_NAMES = Object.keys(Icons).filter(k => k !== 'HelpCircle' && k !== 'CircleHelp');

export const IconByName = ({ name, className }: { name: string; className?: string }) => {
    const Icon = Icons[name] || Icons.CircleHelp || Icons.HelpCircle;
    if (!Icon) return null;
    return <Icon className={className} />;
};

export const IconPicker = ({ value, onChange }: { value: string; onChange: (icon: string) => void }) => {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                        <IconByName name={value || 'CircleHelp'} className="h-4 w-4" />
                        <span>{value || 'Seleccionar Icono'}</span>
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 z-[3000]">
                <div
                    className="h-[300px] p-4 overflow-y-auto"
                    onWheel={(e) => e.stopPropagation()}
                >
                    <div className="grid grid-cols-4 gap-2">
                        {ICON_NAMES.map((name) => (
                            <Button
                                key={name}
                                variant={value === name ? "default" : "ghost"}
                                className={cn("h-10 w-10 p-0", value === name && "bg-primary text-primary-foreground")}
                                onClick={() => {
                                    onChange(name);
                                    setOpen(false);
                                }}
                            >
                                <IconByName name={name} className="h-5 w-5" />
                            </Button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
