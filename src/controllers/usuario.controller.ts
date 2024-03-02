import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {Configuracion} from '../llaves/configuracion';
import {CambioClave, Credenciales, CredencialesRecuperarClave, NotificacionCorreo, NotificacionSms, Usuario} from '../models';
import {UsuarioRepository} from '../repositories';
import {AdministradorClavesService, NotificacionesService, SesionUsuariosService} from '../services';

export class UsuarioController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,
    @service(AdministradorClavesService)
    public servicioClaves: AdministradorClavesService,
    @service(NotificacionesService)
    public servicioNotificaciones: NotificacionesService,
    @service(SesionUsuariosService)
    public servicioSesionUsuario: SesionUsuariosService
  ) { }

  @post('/usuarios')
  @response(200, {
    description: 'Usuario model instance',
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {
            title: 'NewUsuario',
            exclude: ['_id'],
          }),
        },
      },
    })
    usuario: Omit<Usuario, '_id'>,
  ): Promise<Usuario> {
    let clave = this.servicioClaves.CrearClaveAleatoria();
    console.log(clave);
    let claveCifrada = this.servicioClaves.CifrarTexto(clave);
    usuario.clave = claveCifrada;
    let usuarioCreado = await this.usuarioRepository.create(usuario);
    if (usuarioCreado) {
      let datos = new NotificacionCorreo();
      datos.destinatario = usuario.correo;
      datos.asunto = Configuracion.asuntoCreacionUsuario;
      datos.mensaje = `${Configuracion.saludo} ${usuario.nombre}<br/>${Configuracion.mensajeCreacionUsuario} ${clave}` // string template
      this.servicioNotificaciones.EnviarCorreo(datos);
    }
    return usuarioCreado;
  }

  @get('/usuarios/count')
  @response(200, {
    description: 'Usuario model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.count(where);
  }

  @get('/usuarios')
  @response(200, {
    description: 'Array of Usuario model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Usuario, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Usuario) filter?: Filter<Usuario>,
  ): Promise<Usuario[]> {
    return this.usuarioRepository.find(filter);
  }

  @patch('/usuarios')
  @response(200, {
    description: 'Usuario PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.updateAll(usuario, where);
  }

  @get('/usuarios/{id}')
  @response(200, {
    description: 'Usuario model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Usuario, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Usuario, {exclude: 'where'}) filter?: FilterExcludingWhere<Usuario>
  ): Promise<Usuario> {
    return this.usuarioRepository.findById(id, filter);
  }

  @patch('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.updateById(id, usuario);
  }

  @put('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.replaceById(id, usuario);
  }

  @del('/usuarios/{id}')
  @response(204, {
    description: 'Usuario DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.usuarioRepository.deleteById(id);
  }

  // Métodos adicionales

  // Provee una nueva clave al usuario al que pertenecen las credenciales dadas. La nueva clave
  // es notificada al usuario mediante mensaje de texto al número que nos proveyó al crear su cuenta.
  @post('/recuperar-clave')
  @response(200, {
    description: 'Recuperar clave de usuarios',
    content: {'application/json': {schema: {}}},
  })
  async recuperarClave(
    @requestBody({
      content: {
        'application/json': {

        },
      },
    })
    credenciales: CredencialesRecuperarClave,
  ): Promise<Usuario | null> {
    let usuario = await this.usuarioRepository.findOne({
      where: {
        correo: credenciales.correo
      }
    });
    if (usuario) {
      let clave = this.servicioClaves.CrearClaveAleatoria();
      console.log(clave);
      let claveCifrada = this.servicioClaves.CifrarTexto(clave);
      usuario.clave = this.servicioClaves.CifrarTexto(clave);
      await this.usuarioRepository.updateById(usuario._id, usuario);
      let datos = new NotificacionSms();
      datos.destino = usuario.celular;
      datos.mensaje = `${Configuracion.saludo} ${usuario.nombre} <br />${Configuracion.mensajeRecuperarClave} ${clave}`;
      this.servicioNotificaciones.EnviarSms(datos);
    }
    return usuario;
  }

  // Dadas las credenciales, se le cambia al usuario dado la clave actual una nueva. Dicho cambio es notificado
  // al usuario vía correo electrónico.
  @post('/cambiar-clave')
  @response(200, {
    description: 'Cambio de clave de usuarios',
    content: {'application/json': {schema: getModelSchemaRef(CambioClave)}},
  })
  async cambiarClave(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CambioClave, {
            title: 'Cambio de Clave del Usuario'
          }),
        },
      },
    })
    credencialesClave: CambioClave,
  ): Promise<Boolean> {
    let usuario = await this.servicioClaves.CambiarClave(credencialesClave);
    if (usuario) {
      let datos = new NotificacionCorreo();
      datos.destinatario = usuario.correo;
      datos.asunto = Configuracion.asuntoCambioClave;
      datos.mensaje = `${Configuracion.saludo} ${usuario.nombre} <br />${Configuracion.mensajeCambioClave}`; // string template
      this.servicioNotificaciones.EnviarCorreo(datos);
    }
    return usuario != null;
  }

  @post('/identificar-usuario')
  @response(200, {
    description: 'Identificación de usuarios',
    content: {'application/json': {schema: getModelSchemaRef(Credenciales)}},
  })
  async identificarUsuario(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Credenciales, {
            title: 'Identificar Usuario'
          }),
        },
      },
    })
    credenciales: Credenciales,
  ): Promise<Object | null> {
    let usuario = await this.servicioSesionUsuario.IdentificarUsuario(credenciales);
    let tk = "";

    if (usuario) {
      usuario.clave = ''; // protegemos la clave del usuario. la variable "usuario" es una copia de los datos del usuario mapeados desde la db,
      // por lo tanto, se modifica la clave del usuario localmente, NO en la bd
      tk = await this.servicioSesionUsuario.GenerarToken(usuario);// generar token y agregarlo a la respuesta
    }
    return {
      token: tk,
      usuario: usuario
    };
  }


}
