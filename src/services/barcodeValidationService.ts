export interface ValidationResult {
  isValid: boolean;
  normalizedBarcode: string | null;
  errors: string[];
  warnings: string[];
}

/**
 * Servicio de validación de códigos de barras
 * Implementa validación de formato, checksum EAN-13/UPC-A y lista negra
 */
export class BarcodeValidationService {
  // Lista negra de códigos conocidos inválidos
  private static readonly BLACKLIST = new Set([
    '00000000',
    '11111111',
    '12345678',
    '87654321',
    '61233331', // Código truncado conocido (debe ser 7503024543339)
  ]);

  // Prefijos reservados o inválidos
  private static readonly INVALID_PREFIXES = ['000', '999', '00000'];

  /**
   * Valida el formato básico del barcode
   */
  private static validateFormat(barcode: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Eliminar espacios y caracteres especiales
    const cleaned = barcode.replace(/[\s\-]/g, '');

    // Validar que solo contenga números
    if (!/^\d+$/.test(cleaned)) {
      errors.push('El código solo puede contener números');
    }

    // Validar longitud (8, 12, 13, 14 dígitos son válidos)
    const validLengths = [8, 12, 13, 14];
    if (!validLengths.includes(cleaned.length)) {
      errors.push(`Longitud inválida: ${cleaned.length} dígitos (esperado: 8, 12, 13 o 14)`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Calcula el checksum EAN-13 usando algoritmo módulo 10
   */
  private static calculateEAN13Checksum(barcode: string): number {
    // Tomar los primeros 12 dígitos
    const digits = barcode.slice(0, 12).split('').map(Number);

    // Sumar dígitos en posiciones impares (índice 0, 2, 4...) × 1
    const sumOdd = digits.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);

    // Sumar dígitos en posiciones pares (índice 1, 3, 5...) × 3
    const sumEven = digits.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0) * 3;

    const total = sumOdd + sumEven;
    const checksum = (10 - (total % 10)) % 10;

    return checksum;
  }

  /**
   * Calcula el checksum UPC-A usando algoritmo módulo 10
   */
  private static calculateUPCAChecksum(barcode: string): number {
    // Tomar los primeros 11 dígitos
    const digits = barcode.slice(0, 11).split('').map(Number);

    // Sumar dígitos en posiciones impares (índice 0, 2, 4...) × 3
    const sumOdd = digits.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0) * 3;

    // Sumar dígitos en posiciones pares (índice 1, 3, 5...) × 1
    const sumEven = digits.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0);

    const total = sumOdd + sumEven;
    const checksum = (10 - (total % 10)) % 10;

    return checksum;
  }

  /**
   * Valida el dígito verificador (checksum) del barcode
   */
  private static validateChecksum(barcode: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const cleaned = barcode.replace(/[\s\-]/g, '');

    // Solo validar checksum para códigos de 12, 13 o 14 dígitos
    if (cleaned.length === 13 || cleaned.length === 14) {
      // EAN-13 (o EAN-14)
      const expectedChecksum = this.calculateEAN13Checksum(cleaned);
      const actualChecksum = parseInt(cleaned[12], 10);

      if (expectedChecksum !== actualChecksum) {
        errors.push(`Checksum inválido (esperado: ${expectedChecksum}, encontrado: ${actualChecksum})`);
      }
    } else if (cleaned.length === 12) {
      // UPC-A
      const expectedChecksum = this.calculateUPCAChecksum(cleaned);
      const actualChecksum = parseInt(cleaned[11], 10);

      if (expectedChecksum !== actualChecksum) {
        errors.push(`Checksum UPC-A inválido (esperado: ${expectedChecksum}, encontrado: ${actualChecksum})`);
      }
    } else if (cleaned.length === 8) {
      // EAN-8: similar al EAN-13 pero con 7 dígitos
      const digits = cleaned.slice(0, 7).split('').map(Number);
      const sumOdd = digits.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0) * 3;
      const sumEven = digits.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0);
      const total = sumOdd + sumEven;
      const expectedChecksum = (10 - (total % 10)) % 10;
      const actualChecksum = parseInt(cleaned[7], 10);

      if (expectedChecksum !== actualChecksum) {
        errors.push(`Checksum EAN-8 inválido (esperado: ${expectedChecksum}, encontrado: ${actualChecksum})`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Verifica si el barcode está en la lista negra
   */
  private static isInBlacklist(barcode: string): { found: boolean; message?: string } {
    const cleaned = barcode.replace(/[\s\-]/g, '');

    // Verificar lista negra exacta
    if (this.BLACKLIST.has(cleaned)) {
      if (cleaned === '61233331') {
        return {
          found: true,
          message: 'Código truncado o incompleto detectado. Este código es inválido.',
        };
      }
      return {
        found: true,
        message: 'Código de prueba o inválido detectado',
      };
    }

    // Verificar prefijos inválidos
    for (const prefix of this.INVALID_PREFIXES) {
      if (cleaned.startsWith(prefix)) {
        return {
          found: true,
          message: `Prefijo inválido: ${prefix}`,
        };
      }
    }

    return { found: false };
  }

  /**
   * Normaliza el barcode a formato estándar
   */
  private static normalizeBarcode(barcode: string): string {
    // Eliminar espacios y caracteres especiales
    let cleaned = barcode.replace(/[\s\-]/g, '');

    // Convertir UPC-A (12 dígitos) a EAN-13 agregando 0 al inicio
    if (cleaned.length === 12) {
      cleaned = '0' + cleaned;
    }

    return cleaned;
  }

  /**
   * Función principal de validación
   * Ejecuta todas las validaciones en orden
   */
  public static validateBarcode(barcode: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      normalizedBarcode: null,
      errors: [],
      warnings: [],
    };

    // Normalizar primero
    const normalized = this.normalizeBarcode(barcode);

    // 1. Validar formato
    const formatValidation = this.validateFormat(normalized);
    if (!formatValidation.valid) {
      result.isValid = false;
      result.errors.push(...formatValidation.errors);
      console.warn('[BarcodeValidation] ⚠️ Format validation failed:', {
        barcode: normalized,
        errors: formatValidation.errors,
      });
      return result; // No continuar si el formato es inválido
    }

    // 2. Verificar lista negra
    const blacklistCheck = this.isInBlacklist(normalized);
    if (blacklistCheck.found) {
      result.isValid = false;
      result.errors.push(blacklistCheck.message || 'Código inválido detectado');
      console.warn('[BarcodeValidation] ⚠️ Barcode in blacklist:', {
        barcode: normalized,
      });
      return result;
    }

    // 3. Validar checksum
    const checksumValidation = this.validateChecksum(normalized);
    if (!checksumValidation.valid) {
      result.isValid = false;
      result.errors.push(...checksumValidation.errors);
      console.warn('[BarcodeValidation] ⚠️ Checksum validation failed:', {
        barcode: normalized,
        errors: checksumValidation.errors,
      });
      return result;
    }

    // 4. Warnings adicionales
    if (normalized.length === 8) {
      result.warnings.push('Código EAN-8 detectado (menos común)');
    }

    // Todo válido
    result.normalizedBarcode = normalized;
    console.log('[BarcodeValidation] ✅ Validated successfully:', {
      original: barcode,
      normalized,
    });

    return result;
  }

  /**
   * Verifica si un barcode es potencialmente válido sin validación completa
   * Útil para validación en tiempo real mientras el usuario escribe
   */
  public static isPartiallyValid(barcode: string): boolean {
    const cleaned = barcode.replace(/[\s\-]/g, '');
    
    // Verificar que solo contenga números
    if (!/^\d*$/.test(cleaned)) {
      return false;
    }

    // Verificar longitud razonable (no más de 14 dígitos)
    if (cleaned.length > 14) {
      return false;
    }

    return true;
  }
}
