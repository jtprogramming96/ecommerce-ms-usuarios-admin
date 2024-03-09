import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Configuracion} from '../llaves/configuracion';
import {Credenciales, Usuario} from '../models';
import {UsuarioRepository} from '../repositories';
const fetch = require('node-fetch');

@injectable({scope: BindingScope.TRANSIENT})
export class SesionUsuariosService {
  constructor(
    @repository(UsuarioRepository)
    private usuarioRepository: UsuarioRepository
  ) { }

  /*
   * Add service methods here
   */

  async IdentificarUsuario(credenciales: Credenciales) {
    let usuario = await this.usuarioRepository.findOne({
      where: {
        correo: credenciales.usuario,
        clave: credenciales.clave
      }
    });
    return usuario;
  }

  async GenerarToken(datos: Usuario): Promise<string> {
    let url = `${Configuracion.url_crear_token}?`
      + `${Configuracion.arg_nombre}=${datos.nombre}&`
      + `${Configuracion.arg_id_persona}=${datos._id}&`
      + `${Configuracion.arg_rol}=${datos.id_rol}`;
    let token = "";

    await fetch(url)
      .then(async (res: any) => {
        token = await res.text();
      });
    return token;
  }

  async VerificarToken(tk: string): Promise<boolean> {
    let url = `${Configuracion.url_verificar_token}?`
      + `${Configuracion.arg_token}=${tk}`;
    let resp = "";

    await fetch(url)
      .then(async (res: any) => {
        resp = await res.text();
      });
    return resp == "OK";
  }
}
