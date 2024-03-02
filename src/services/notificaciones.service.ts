import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {Configuracion} from '../llaves/configuracion';
import {NotificacionCorreo, NotificacionSms} from '../models';

const fetch = require('node-fetch');

@injectable({scope: BindingScope.TRANSIENT})
export class NotificacionesService {
  constructor(/* Add @inject to inject parameters */) { }

  /*
   * Add service methods here
   */

  async EnviarCorreo(datos: NotificacionCorreo) {
    //let url = `${Configuracion.urlCorreo}?${Configuracion.destinoArg}=${datos.destinatario}&${Configuracion.asuntoArg}=${datos.asunto}&${Configuracion.mensajeArg}=${datos.mensaje}&${Configuracion.hashArg}=${Configuracion.hashNotificacion}`;
    let url = `${Configuracion.urlCorreo}?`
      + `${Configuracion.destinoArg}=${datos.destinatario}&`
      + `${Configuracion.asuntoArg}=${datos.asunto}&`
      + `${Configuracion.mensajeArg}=${datos.mensaje}&`
      + `${Configuracion.hashArg}=${Configuracion.hashNotificacion}`;

    fetch(url)
      .then((res: any) => {
        console.log(res.text())
      })
  }

  async EnviarSms(datos: NotificacionSms) {
    //let url = `${Configuracion.urlCorreo}?${Configuracion.destinoArg}=${datos.destinatario}&${Configuracion.asuntoArg}=${datos.asunto}&${Configuracion.mensajeArg}=${datos.mensaje}&${Configuracion.hashArg}=${Configuracion.hashNotificacion}`;
    let url = `${Configuracion.urlMensajeTexto}?`
      + `${Configuracion.destinoArg}=${datos.destino}&`
      + `${Configuracion.mensajeArg}=${datos.mensaje}&`
      + `${Configuracion.hashArg}=${Configuracion.hashNotificacion}`;

    fetch(url)
      .then((res: any) => {
        console.log(res.text())
      })
  }
}
