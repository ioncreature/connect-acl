connect-acl
===========

Simple ACL for Connect/Express.

connect-acl can work only with Roles and Permissions.

It consists of these parts:
* Connect middleware
* Routing helper
* Route handler helper
* Template helper

Configuring
-----------

```js
// Permissions and roles config.
var roles = {
    admin: {can: ['create article', 'read article', 'edit article']},
    user: {can: ['read article']}
};

// Create Acl instance
var role = require( 'connect-acl' )( roles );

// Global failure handlers (optional)
role.onAuthorizedFailure( function( req, res ){
    res.redirect( '/login' );
});
role.onUnauthorizedFailure( function( req, res ){
    res.redirect( '/' );
});

// Define where the user session is on the request object
role.userSessionHandler( function( req ) {
    // Example using custom Passport auth
    return req.user;
});

// Сonnect a middleware
app.use( role.middleware() );

// Authorizing
app.post( '/login', role.isUnauthorized(), function( req, res ){
    // ...

    // User should contains user.roles array,
    // which is {string[]} and conrtains a list of role names.
    // If user.roles is falsy then user considered as authorized, but no one role won't be assigned
    req.session.user = user;

    // ..
});
```

Using router helper
-------------------

```js
// Simple authorized/unauthorized checking
app.get( '/', role.isAuthorized(), routes.getIndex );
app.get( '/login', role.isUnauthorized( someCustomeFailureHandler ), routes.getLogin );

// Check permissions
app.get( '/article/:id', role.can('read article'), routes.getArticle );
app.post( '/article/:id', role.can('edit article', someCustomFailureHandler), routes.editArticle );

// Check for role
app.get( '/settings', role.is('admin'), routes.getSettings );
app.get( '/settings', role.is('admin', someCustomFailureHandler), routes.getSettings );

// This checks whether user has 'admin' AND 'user' roles
app.get( '/user/settings', role.is(['admin', 'user']), routes.getSettings );

// This checks whether user has 'admin' OR 'user' roles
app.post( '/message/:id', role.isAny(['admin', 'user']), routes.postMessage );
```

Using in route handler
----------------------

```js
app.get( '/some/path', function( req, res ){
    var role = req.role;
    if ( role.can('do something') )
        // ... 
    else if ( role.is('admin') )
        // ...
    else if ( role.isAuthorized() )
        // ...
    else
        // ...
});
```

Using in templates (i.e. Jade)
------------------------------

```jade
extends layout
block content
    h1= title
    if role.is('admin')
        p Hello Admin!
    else
        p Hello Man!
```
