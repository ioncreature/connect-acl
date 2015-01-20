/**
 * @licence BSD 2-Clause
 * @author Alexander Marenin
 * @date November 2013
 */

var STATUS_FORBIDDEN = 403;

/**
 * @param {Object} rolesConfig
 * @returns {Acl}
 */
function createAcl( rolesConfig ){
    return new Acl( rolesConfig );
}
createAcl.Role = Role;
createAcl.Acl = Acl;

module.exports = createAcl;


/**
 * @param {Object} rolesConfig
 * @constructor
 */
function Acl( rolesConfig ){
    this.roles = rolesConfig;
    this.authorizedFailureHandler = null;
    this.unauthorizedFailureHandler = null;
    this.userSessionHandler = null;
}


/**
 * @param {string|string[]} roleName
 * @param {Function?} failureBack
 * @returns {Function}
 */
Acl.prototype.is = function( roleName, failureBack ){
    var acl = this;
    return function( req, res, next ){
        if ( req.role && req.role.is(roleName) )
            next();
        else
            acl.handleFailure( req, res, next, failureBack );
    };
};


/**
 * @param {string[]} roles
 * @param failureBack
 */
Acl.prototype.isAny = function( roles, failureBack ){
    var acl = this;
    return function( req, res, next ){
        if ( req.role && req.role.isAny(roles) )
            next();
        else
            acl.handleFailure( req, res, next, failureBack );
    };
};


/**
 * @param {Function?} failureBack
 * @returns {Function}
 */
Acl.prototype.isAuthorized = function( failureBack ){
    var acl = this;
    return function( req, res, next ){
        if ( req.role && req.role.isAuthorized() )
            next();
        else
            acl.handleFailure( req, res, next, failureBack || acl.authorizedFailureHandler );
    };
};


/**
 * @param {Function?} failureBack
 * @returns {Function}
 */
Acl.prototype.isUnauthorized = function( failureBack ){
    var acl = this;
    return function( req, res, next ){
        if ( req.role )
            if ( req.role.isUnauthorized() )
                next();
            else
                acl.handleFailure( req, res, next, failureBack || acl.unauthorizedFailureHandler );
        else
            next();
    };
};


/**
 * @param {string} permissionName
 * @param {Function?} failureBack
 * @returns {Function}
 */
Acl.prototype.can = function( permissionName, failureBack ){
    var acl = this;
    return function( req, res, next ){
        if ( req.role && req.role.can(permissionName) )
            next();
        else
            acl.handleFailure( req, res, next, failureBack );
    };
};


/**
 * @param {Function} fn
 */
Acl.prototype.onAuthorizedFailure = function( fn ){
    this.authorizedFailureHandler = fn;
};


/**
 * @param {Function} fn
 */
Acl.prototype.onUnauthorizedFailure = function( fn ){
    this.unauthorizedFailureHandler = fn;
};

/**
 * @param {Function} fn
 */
Acl.prototype.userSessionHandler = function( fn ){
    this.userSessionHandler = fn;
};

Acl.prototype.middleware = function(){
    var acl = this;
    return function( req, res, next ){
        req.role = new Role( acl.roles );
        res.locals.role = req.role;

        var user = req.session && req.session.user;

        // Allow custom lookup of user
        if (typeof acl.userSessionHandler === 'function') {
          user = acl.userSessionHandler(req);
        }

        if ( user.role ) {
          req.role.addRole( user.role );
        } else {
          req.role.setAuthorized( true );
        }

        next();
    };
};


Acl.prototype.handleFailure = function( req, res, next, failureBack ){
    var role = req.role;
    if ( failureBack )
        failureBack( req, res, next );
    else if ( role.isAuthorized() && this.authorizedFailureHandler )
        this.authorizedFailureHandler( req, res, next );
    else if ( role.isUnauthorized() && this.unauthorizedFailureHandler )
        this.unauthorizedFailureHandler( req, res, next );
    else
        res.send( STATUS_FORBIDDEN );
};


/**
 * @param rolesConfig
 * @constructor
 */
function Role( rolesConfig ){
    this.cfg = rolesConfig;
    this.roles = [];
    this.authorized = false;
}


/**
 * @param {string|string[]} role
 * @returns {boolean}
 */
Role.prototype.is = function( role ){
    if ( role instanceof Array )
        return role.every( function( roleName ){
            return this.roles.indexOf( roleName ) > -1;
        }, this );
    else
        return this.roles.indexOf( role ) > -1;
};


/**
 * @param {string[]} roles
 * @returns {boolean}
 */
Role.prototype.isAny = function( roles ){
    for ( var i = 0; i < roles.length; i++ )
        if ( this.is(roles[i]) )
            return true;
    return false;
};


/**
 * @param {string} permissionName
 * @returns {boolean}
 */
Role.prototype.can = function( permissionName ){
    for ( var i = 0; i < this.roles.length; i++ ){
        var roleCfg = this.cfg[this.roles[i]];
        if ( roleCfg && roleCfg.can.indexOf(permissionName) > -1 )
            return true;
    }
    return false;
};


Role.prototype.isAuthorized = function(){
    return this.authorized;
};


Role.prototype.isUnauthorized = function(){
    return !this.authorized;
};


/**
 * @param {string|string[]} roleName
 */
Role.prototype.addRole = function( roleName ){
    this.authorized = true;
    if ( roleName instanceof Array )
        roleName.forEach( this.addRole, this );
    else if ( this.roles.indexOf(roleName) == -1 )
        this.roles.push.apply( this.roles, arguments );
};


Role.prototype.removeRole = function( roleName ){
    var index = this.roles.indexOf( roleName );
    if ( index > -1 )
        this.roles.splice( index, 1 );
};


Role.prototype.setAuthorized = function( val ){
    this.authorized = !!val;
};
