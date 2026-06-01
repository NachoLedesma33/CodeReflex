'use client';

import { useState } from 'react';
import { Exercise, ExerciseHint } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  FileText,
  Tag,
  Lightbulb,
  Clock,
  HardDrive,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ExerciseInfoProps {
  exercise: Exercise;
  showHints?: boolean;
  className?: string;
}

export function ExerciseInfo({
  exercise,
  showHints = true,
  className,
}: ExerciseInfoProps) {
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['context', 'concepts'])
  );

  const availableHints = exercise.hints || [];
  const canShowMoreHints = revealedHints < availableHints.length;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const revealNextHint = () => {
    setRevealedHints(prev => Math.min(prev + 1, availableHints.length));
  };

  const renderMarkdown = (text: string): React.ReactNode => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';

    lines.forEach((line, i) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${i}`} className="bg-bg-elevated p-3 rounded-lg text-sm text-text-primary overflow-x-auto my-2">
              <code>{codeContent}</code>
            </pre>
          );
          codeContent = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLanguage = line.slice(3);
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-xl font-bold text-text-primary mt-4 mb-2">{line.slice(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-lg font-semibold text-text-primary mt-3 mb-2">{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-md font-medium text-text-primary mt-2 mb-1">{line.slice(4)}</h3>);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(<li key={i} className="text-text-secondary ml-4 list-disc">{line.slice(2)}</li>);
      } else if (/^\d+\.\s/.test(line)) {
        elements.push(<li key={i} className="text-text-secondary ml-4 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>);
      } else if (line.startsWith('> ')) {
        elements.push(<blockquote key={i} className="border-l-2 border-border-strong pl-3 text-text-muted italic my-2">{line.slice(2)}</blockquote>);
      } else if (line.trim() === '') {
        elements.push(<br key={i} />);
      } else {
        const formattedLine = line
          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary font-semibold">$1</strong>')
          .replace(/\*(.+?)\*/g, '<em class="text-text-primary">$1</em>')
          .replace(/`(.+?)`/g, '<code class="bg-bg-elevated px-1 rounded text-blue-400 text-sm">$1</code>');
        
        elements.push(
          <p key={i} className="text-text-secondary my-1" dangerouslySetInnerHTML={{ __html: formattedLine }} />
        );
      }
    });

    return elements;
  };

  return (
    <Card variant="bordered" className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'px-2 py-0.5 text-xs rounded-full',
                exercise.level === 'fundamentals' && 'bg-green-500/20 text-green-400',
                exercise.level === 'intermediate' && 'bg-yellow-500/20 text-yellow-400',
                exercise.level === 'interview' && 'bg-orange-500/20 text-orange-400',
                exercise.level === 'advanced' && 'bg-red-500/20 text-red-400',
              )}>
                {exercise.level}
              </span>
              <span className="text-xs text-text-muted uppercase">{exercise.language}</span>
              <span className="text-xs text-text-muted">• {exercise.category}</span>
            </div>
            <h2 className="text-lg font-semibold text-text-primary">{exercise.title}</h2>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {exercise.description && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <FileText className="w-3 h-3" />
              <span>Descripción</span>
            </div>
            <div className="text-sm text-text-secondary">
              {renderMarkdown(exercise.description)}
            </div>
          </div>
        )}

        {exercise.context && (
          <div className="space-y-1">
            <button
              onClick={() => toggleSection('context')}
              className="flex items-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors w-full"
            >
              <span>📚 Contexto Real</span>
              {expandedSections.has('context') ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
            {expandedSections.has('context') && (
              <div className="bg-bg-elevated/50 rounded-lg p-3 text-sm text-text-secondary border border-border-strong/50">
                {renderMarkdown(exercise.context)}
              </div>
            )}
          </div>
        )}

        {exercise.concepts && exercise.concepts.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('concepts')}
              className="flex items-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors w-full"
            >
              <BookOpen className="w-3 h-3" />
              <span>Conceptos</span>
              {expandedSections.has('concepts') ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
            {expandedSections.has('concepts') && (
              <div className="flex flex-wrap gap-1.5">
                {exercise.concepts.map((concept, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {exercise.tags && exercise.tags.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Tag className="w-3 h-3" />
              <span>Etiquetas</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {exercise.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs bg-bg-elevated text-text-muted rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {(exercise.timeComplexity || exercise.spaceComplexity) && (
          <div className="grid grid-cols-2 gap-3">
            {exercise.timeComplexity && (
              <div className="bg-bg-elevated/50 rounded-lg p-2">
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                  <Clock className="w-3 h-3" />
                  <span>Tiempo</span>
                </div>
                <code className="text-sm text-text-primary font-mono">{exercise.timeComplexity}</code>
              </div>
            )}
            {exercise.spaceComplexity && (
              <div className="bg-bg-elevated/50 rounded-lg p-2">
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                  <HardDrive className="w-3 h-3" />
                  <span>Espacio</span>
                </div>
                <code className="text-sm text-text-primary font-mono">{exercise.spaceComplexity}</code>
              </div>
            )}
          </div>
        )}

        {exercise.prerequisites && exercise.prerequisites.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <CheckCircle2 className="w-3 h-3" />
              <span>Prerrequisitos</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {exercise.prerequisites.map((prereq, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded"
                >
                  {prereq}
                </span>
              ))}
            </div>
          </div>
        )}

        {showHints && availableHints.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Lightbulb className="w-3 h-3" />
                <span>Pistas ({revealedHints}/{availableHints.length})</span>
              </div>
              {canShowMoreHints && (
                <Button variant="ghost" size="sm" onClick={revealNextHint}>
                  Revelar Pista
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {availableHints.slice(0, revealedHints).map((hint, i) => (
                <div
                  key={hint.id || i}
                  className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-yellow-200">{hint.text}</span>
                  </div>
                </div>
              ))}
              {revealedHints === 0 && (
                <div className="text-xs text-text-muted italic">
                  Haz clic en &quot;Revelar Pista&quot; si te quedas atascado
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 text-xs text-text-muted">
          <span>Duración est.: {Math.floor(exercise.estimatedDuration / 60)}min</span>
          <span className="mx-2">•</span>
          <span>Dificultad: {exercise.difficultyScore}/10</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default ExerciseInfo;