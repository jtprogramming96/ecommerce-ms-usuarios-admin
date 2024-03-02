import {Model, model, property} from '@loopback/repository';

/**
 * Clase que modela las credenciales necesarias para la recuperación de la clave del usuario.
 * Solo requiere el correo, pero podría solicitar otros datos(como el documento de identificación por ejemplo).
 */
@model()
export class CredencialesRecuperarClave extends Model {
  @property({
    type: 'string',
    required: true,
  })
  correo: string;


  constructor(data?: Partial<CredencialesRecuperarClave>) {
    super(data);
  }
}

export interface CredencialesRecuperarClaveRelations {
  // describe navigational properties here
}

export type CredencialesRecuperarClaveWithRelations = CredencialesRecuperarClave & CredencialesRecuperarClaveRelations;
