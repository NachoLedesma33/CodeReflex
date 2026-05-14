'use client';

import { useCallback, useMemo } from 'react';
import { ExerciseTestCase } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Code2,
  Play,
} from 'lucide-react';

interface SolutionCheckProps {
  userCode: string;
  expectedCode: string;
  testCases?: ExerciseTestCase[];
  options?: ValidationOptions;
  onExecute?: (code: string) => Promise<ExecutionResult>;
  className?: string;
}

export interface ValidationOptions {
  ignoreSpaces?: boolean;
  ignoreComments?: boolean;
  ignoreVariableNames?: boolean;
  ignoreFunctionNames?: boolean;
  caseSensitive?: boolean;
  strictEquality?: boolean;
}

export type ValidationStatus = 'correct' | 'partial' | 'incorrect' | 'pending';

export interface ValidationResult {
  status: ValidationStatus;
  score: number;
  details: ValidationDetail[];
  message: string;
}

export interface ValidationDetail {
  type: 'syntax' | 'structure' | 'output' | 'format';
  passed: boolean;
  expected?: string;
  actual?: string;
  message: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  testResults?: TestExecutionResult[];
}

export interface TestExecutionResult {
  testCaseId: string;
  passed: boolean;
  actual: string;
  expected: string;
  executionTime?: number;
}

export function SolutionCheck({
  userCode,
  expectedCode,
  testCases = [],
  options = {},
  onExecute,
  className,
}: SolutionCheckProps) {
  const {
    ignoreSpaces = true,
    ignoreComments = true,
    ignoreVariableNames = false,
    ignoreFunctionNames = false,
    caseSensitive = false,
    strictEquality = false,
  } = options;

  const normalizeCode = useCallback((code: string): string => {
    let normalized = code;

    if (ignoreComments) {
      normalized = normalized
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/#.*$/gm, '');
    }

    if (ignoreSpaces) {
      normalized = normalized
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}()\[\],;:])\s*/g, '$1')
        .replace(/^\s+|\s+$/g, '')
        .trim();
    }

    if (ignoreVariableNames) {
      normalized = normalized.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, '_VAR_');
    }

    if (ignoreFunctionNames) {
      normalized = normalized.replace(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, 'function _FN_');
      normalized = normalized.replace(/const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g, 'const _FN_ =');
      normalized = normalized.replace(/let\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g, 'let _FN_ =');
    }

    if (!caseSensitive) {
      normalized = normalized.toLowerCase();
    }

    return normalized;
  }, [ignoreSpaces, ignoreComments, ignoreVariableNames, ignoreFunctionNames, caseSensitive]);

  const validateStructure = useCallback((user: string, expected: string): ValidationDetail => {
    const normalizedUser = normalizeCode(user);
    const normalizedExpected = normalizeCode(expected);

    if (normalizedUser === normalizedExpected) {
      return {
        type: 'structure',
        passed: true,
        message: 'La estructura del código coincide perfectamente',
      };
    }

    const userLength = normalizedUser.length;
    const expectedLength = normalizedExpected.length;
    const similarity = calculateSimilarity(normalizedUser, normalizedExpected);

    if (similarity > 0.9) {
      return {
        type: 'structure',
        passed: false,
        message: `El código es muy similar (${Math.round(similarity * 100)}%) pero tiene pequeñas diferencias`,
        expected: normalizedExpected.slice(0, 50) + '...',
        actual: normalizedUser.slice(0, 50) + '...',
      };
    }

    if (similarity > 0.5) {
      return {
        type: 'structure',
        passed: false,
        message: `Coincidencia parcial (${Math.round(similarity * 100)}%). Revisa las diferencias.`,
        expected: normalizedExpected.slice(0, 50) + '...',
        actual: normalizedUser.slice(0, 50) + '...',
      };
    }

    return {
      type: 'structure',
      passed: false,
      message: 'La estructura del código difiere significativamente',
      expected: normalizedExpected.slice(0, 50) + '...',
      actual: normalizedUser.slice(0, 50) + '...',
    };
  }, [normalizeCode]);

  const validateSyntax = useCallback((code: string): ValidationDetail => {
    try {
      const checkFn = new Function(code) as (...args: unknown[]) => unknown;
      checkFn();
      return {
        type: 'syntax',
        passed: true,
        message: 'No se detectaron errores de sintaxis',
      };
    } catch (e) {
      return {
        type: 'syntax',
        passed: false,
        message: `Error de sintaxis: ${(e as Error).message}`,
      };
    }
  }, []);

  const validateFormat = useCallback((user: string, expected: string): ValidationDetail => {
    const normalizedUser = normalizeCode(user);
    const normalizedExpected = normalizeCode(expected);

    const userLines = normalizedUser.split('').filter(c => c === '\n').length + 1;
    const expectedLines = normalizedExpected.split('').filter(c => c === '\n').length + 1;

    const lineDiff = Math.abs(userLines - expectedLines);
    
    if (lineDiff === 0) {
      return {
        type: 'format',
        passed: true,
        message: `El formato coincide (${userLines} líneas)`,
      };
    }

    return {
      type: 'format',
      passed: false,
      message: `El número de líneas difiere: las tuyas (${userLines}) vs esperado (${expectedLines})`,
      expected: `${expectedLines} lines`,
      actual: `${userLines} lines`,
    };
  }, [normalizeCode]);

  const runTests = useCallback(async (): Promise<TestExecutionResult[]> => {
    if (!onExecute || testCases.length === 0) {
      return [];
    }

    const results: TestExecutionResult[] = [];

    for (const testCase of testCases) {
      try {
        const result = await onExecute(userCode);
        const passed = result.output.trim() === testCase.expected.trim();
        
        results.push({
          testCaseId: testCase.id,
          passed,
          actual: result.output,
          expected: testCase.expected,
          executionTime: result.executionTime,
        });
      } catch {
        results.push({
          testCaseId: testCase.id,
          passed: false,
          actual: 'Error',
          expected: testCase.expected,
        });
      }
    }

    return results;
  }, [userCode, testCases, onExecute]);

  const validate = useCallback((): ValidationResult => {
    if (!userCode.trim()) {
      return {
        status: 'pending',
        score: 0,
        details: [],
        message: 'No se proporcionó código',
      };
    }

    const syntaxCheck = validateSyntax(userCode);
    const details: ValidationDetail[] = [syntaxCheck];

    if (!syntaxCheck.passed) {
      return {
        status: 'incorrect',
        score: 0,
        details,
        message: 'El código tiene errores de sintaxis',
      };
    }

    const formatCheck = validateFormat(userCode, expectedCode);
    details.push(formatCheck);

    const structureCheck = validateStructure(userCode, expectedCode);
    details.push(structureCheck);

    let score = 0;
    if (syntaxCheck.passed) score += 30;
    if (formatCheck.passed) score += 20;
    if (structureCheck.passed) score += 50;

    let status: ValidationStatus;
    if (score >= 90) {
      status = 'correct';
    } else if (score >= 50) {
      status = 'partial';
    } else {
      status = 'incorrect';
    }

    const message = status === 'correct' 
      ? '¡Perfecto! Tu solución es correcta.'
      : status === 'partial'
      ? `Parcialmente correcto (${score}% de coincidencia). ${structureCheck.message}`
      : 'La solución no coincide con el resultado esperado';

    return { status, score, details, message };
  }, [userCode, expectedCode, validateSyntax, validateFormat, validateStructure]);

  const validation = useMemo(() => validate(), [validate]);

  return (
    <Card variant="bordered" className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-400">Validación de Solución</h3>
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
            validation.status === 'correct' && 'bg-green-500/20 text-green-400',
            validation.status === 'partial' && 'bg-yellow-500/20 text-yellow-400',
            validation.status === 'incorrect' && 'bg-red-500/20 text-red-400',
            validation.status === 'pending' && 'bg-zinc-700 text-zinc-400',
          )}>
            {validation.status === 'correct' && <CheckCircle2 className="w-3 h-3" />}
            {validation.status === 'partial' && <AlertCircle className="w-3 h-3" />}
            {validation.status === 'incorrect' && <XCircle className="w-3 h-3" />}
            {validation.status === 'pending' && <Code2 className="w-3 h-3" />}
            {validation.status === 'correct' ? 'Correcto' : 
             validation.status === 'partial' ? 'Parcial' : 
             validation.status === 'incorrect' ? 'Incorrecto' : 'Pendiente'}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-sm text-zinc-300 mb-3">
          {validation.message}
        </div>

        <div className="space-y-2">
          {validation.details.map((detail, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2 p-2 rounded-lg text-sm',
                detail.passed ? 'bg-green-500/10' : 'bg-red-500/10',
              )}
            >
              {detail.passed ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className={detail.passed ? 'text-green-400' : 'text-red-400'}>
                  Control de {detail.type === 'syntax' ? 'Sintaxis' : 
                            detail.type === 'structure' ? 'Estructura' : 
                            detail.type === 'format' ? 'Formato' : 'Salida'}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">{detail.message}</div>
                {!detail.passed && detail.expected && (
                  <div className="text-xs mt-1">
                    <span className="text-zinc-600">Esperado: </span>
                    <code className="text-zinc-400">{detail.expected}</code>
                  </div>
                )}
                {!detail.passed && detail.actual && (
                  <div className="text-xs">
                    <span className="text-zinc-600">Obtenido: </span>
                    <code className="text-red-400">{detail.actual}</code>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {testCases.length > 0 && onExecute && (
          <div className="pt-2 border-t border-zinc-700">
            <div className="text-xs text-zinc-500 mb-2">
              Ejecuta las pruebas para validar la salida
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator,
      );
    }
  }

  const distance = track[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}

export function validateSolution(
  userCode: string,
  expectedCode: string,
  options?: ValidationOptions
): ValidationResult {
  const {
    ignoreSpaces = true,
    ignoreComments = true,
    ignoreVariableNames = false,
    ignoreFunctionNames = false,
    caseSensitive = false,
  } = options || {};

  const normalizeCode = (code: string): string => {
    let normalized = code;
    if (ignoreComments) {
      normalized = normalized.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/#.*$/gm, '');
    }
    if (ignoreSpaces) {
      normalized = normalized.replace(/\s+/g, ' ').replace(/\s*([{}()\[\],;:])\s*/g, '$1').replace(/^\s+|\s+$/g, '').trim();
    }
    if (ignoreVariableNames) {
      normalized = normalized.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, '_VAR_');
    }
    if (ignoreFunctionNames) {
      normalized = normalized.replace(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, 'function _FN_');
    }
    if (!caseSensitive) {
      normalized = normalized.toLowerCase();
    }
    return normalized;
  };

  const validateSyntax = (code: string): ValidationDetail => {
    try {
      (new Function(code) as unknown as () => void)();
      return { type: 'syntax', passed: true, message: 'No syntax errors detected' };
    } catch (e) {
      return { type: 'syntax', passed: false, message: `Syntax error: ${(e as Error).message}` };
    }
  };

  const validateFormat = (user: string, expected: string): ValidationDetail => {
    const nu = normalizeCode(user);
    const ne = normalizeCode(expected);
    const userLines = nu.split('').filter(c => c === '\n').length + 1;
    const expectedLines = ne.split('').filter(c => c === '\n').length + 1;
    if (Math.abs(userLines - expectedLines) === 0) {
      return { type: 'format', passed: true, message: `Format matches (${userLines} lines)` };
    }
    return { type: 'format', passed: false, message: `Line count differs: yours (${userLines}) vs expected (${expectedLines})` };
  };

  const validateStructure = (user: string, expected: string): ValidationDetail => {
    const nu = normalizeCode(user);
    const ne = normalizeCode(expected);
    if (nu === ne) {
      return { type: 'structure', passed: true, message: 'Code structure matches perfectly' };
    }
    const similarity = calculateSimilarity(nu, ne);
    if (similarity > 0.9) {
      return { type: 'structure', passed: false, message: `Code is very similar (${Math.round(similarity * 100)}%) but has minor differences` };
    }
    if (similarity > 0.5) {
      return { type: 'structure', passed: false, message: `Partial match (${Math.round(similarity * 100)}%). Check the differences.` };
    }
    return { type: 'structure', passed: false, message: 'Code structure differs significantly' };
  };

  const syntaxCheck = validateSyntax(userCode);
  const details: ValidationDetail[] = [syntaxCheck];
  if (!syntaxCheck.passed) {
    return { status: 'incorrect', score: 0, details, message: 'Code has syntax errors' };
  }

  const formatCheck = validateFormat(userCode, expectedCode);
  details.push(formatCheck);
  const structureCheck = validateStructure(userCode, expectedCode);
  details.push(structureCheck);

  let score = 0;
  if (syntaxCheck.passed) score += 30;
  if (formatCheck.passed) score += 20;
  if (structureCheck.passed) score += 50;

  const status = score >= 90 ? 'correct' : score >= 50 ? 'partial' : 'incorrect';
  const message = status === 'correct' ? 'Perfect! Your solution is correct.' : status === 'partial' ? `Partially correct (${score}% match).` : 'Solution does not match expected output';

  return { status, score, details, message };
}

export default SolutionCheck;