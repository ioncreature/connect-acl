/**
 * @author Alexander Marenin
 * @date November 2013
 */

var acl = require( '../index.js' ),
    expect = require( 'expect.js' );

describe( 'Role', function(){
    var role;

    beforeEach( function(){
        role = new acl.Role({
            admin: {can:['read', 'edit']},
            user: {can: ['read']}
        });
    });

    describe( 'checking auth', function(){
        it( 'should check authorization flag', function(){
            expect( role.isAuthorized() ).not.to.be.ok();
            expect( role.isUnauthorized() ).to.be.ok();

            role.addRole( 'user' );
            expect( role.isAuthorized() ).to.be.ok();
            expect( role.isUnauthorized() ).not.to.be.ok();

            role.removeRole( 'user' );
            expect( role.isAuthorized() ).to.be.ok();
            expect( role.isUnauthorized() ).not.to.be.ok();
        });

        it( 'should add/remove roles and check it', function(){
            expect( role.is('user') ).not.to.be.ok();

            role.addRole( 'user' );
            expect( role.is('user') ).to.be.ok();
            expect( role.is('admin') ).not.to.be.ok();

            role.addRole( 'admin' );
            expect( role.is('user') ).to.be.ok();
            expect( role.is('admin') ).to.be.ok();
            expect( role.is(['admin', 'user']) ).to.be.ok();
            expect( role.isAny(['admin', 'user']) ).to.be.ok();

            role.removeRole( 'admin' );
            expect( role.is('user') ).to.be.ok();
            expect( role.is('admin') ).not.to.be.ok();
            expect( role.isAny(['admin', 'user']) ).to.be.ok();

            role.removeRole( 'user' );
            expect( role.is('user') ).not.to.be.ok();
            expect( role.isAny(['admin', 'user']) ).not.to.be.ok();
        });

        it( 'should check permissions', function(){
            expect( role.can('read') ).not.to.be.ok();
            expect( role.can('edit') ).not.to.be.ok();

            role.addRole( 'user' );
            expect( role.can('read') ).to.be.ok();

            role.addRole( 'admin' );
            expect( role.can('read') ).to.be.ok();
            expect( role.can('edit') ).to.be.ok();

            role.removeRole( 'user' );
            expect( role.can('read') ).to.be.ok();
            expect( role.can('edit') ).to.be.ok();

            role.removeRole( 'admin' );
            expect( role.can('read') ).not.to.be.ok();
            expect( role.can('edit') ).not.to.be.ok();
        });
    });
});