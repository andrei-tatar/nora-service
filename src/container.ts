import controllers from './http/controllers';
import { DisconnectService } from './http/services/disconnect.service';
import { ExecuteService } from './http/services/execute.service';
import { QueryService } from './http/services/query.service';
import { SyncService } from './http/services/sync.service';
import { Container, Lifetime } from './ioc';
import { DevicesRepository } from './services/devices.repository';
import { FirebaseService } from './services/firebase.service';
import { JwtService } from './services/jwt.service';
import { NoderedTokenService } from './services/nodered-token.service';
import { NotifyGoogleService } from './services/notifygoogle.service';
import { PostgressService } from './services/postgress.service';
import { UserRepository } from './services/user.repository';
import { ValidationService } from './services/validation.service';
import { ConnectionHandler } from './socket/connectionhandler';

const container = new Container();

controllers.forEach(ctrl => container.register({
    token: ctrl,
    useClass: ctrl,
    lifetime: Lifetime.Request,
}));

container.register({ token: SyncService, useClass: SyncService, lifetime: Lifetime.Request });
container.register({ token: QueryService, useClass: QueryService, lifetime: Lifetime.Request });
container.register({ token: ExecuteService, useClass: ExecuteService, lifetime: Lifetime.Request });
container.register({ token: DisconnectService, useClass: DisconnectService, lifetime: Lifetime.Request });
container.register({ token: ConnectionHandler, useClass: ConnectionHandler, lifetime: Lifetime.Request });
container.register({ token: DevicesRepository, useClass: DevicesRepository, lifetime: Lifetime.Request });
container.register({ token: NotifyGoogleService, useClass: NotifyGoogleService, lifetime: Lifetime.Request });

container.register({ token: UserRepository, useClass: UserRepository });
container.register({ token: NoderedTokenService, useClass: NoderedTokenService });
container.register({ token: JwtService, useClass: JwtService });
container.register({ token: PostgressService, useClass: PostgressService });
container.register({ token: FirebaseService, useClass: FirebaseService });
container.register({ token: ValidationService, useClass: ValidationService });

export { container };
