import { describe, expect, it } from 'vitest';
import { clasificarIncidenciaDeterminista } from './clasificador';

describe('clasificarIncidenciaDeterminista', () => {
  it('clasifica cartera olvidada como objeto_olvidado de severidad media', () => {
    const result = clasificarIncidenciaDeterminista('Olvidé una cartera negra en el asiento.');

    expect(result.tipologia).toBe('objeto_olvidado');
    expect(result.severidad).toBe('media');
    expect(result.confianza).toBeGreaterThan(0.9);
    expect(result.señales).toContain('olvide');
    expect(result.señales).toContain('cartera');
  });

  it('clasifica casaca olvidada como objeto_olvidado de baja severidad', () => {
    const result = clasificarIncidenciaDeterminista('Creo que dejé mi casaca en el taxi.');

    expect(result.tipologia).toBe('objeto_olvidado');
    expect(result.severidad).toBe('baja');
  });

  it('no inventa una tipología de bienestar fuera del alcance demo', () => {
    const result = clasificarIncidenciaDeterminista('El aire acondicionado estaba muy fuerte.');

    expect(result.tipologia).toBe('otro');
    expect(result.confianza).toBeLessThan(0.5);
  });
});
