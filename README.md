This project collects jQuery Transports designed to be used with the Jive Application Framework.

The common interface is simple.  

*register* 

This method constructs a transport and registers it with jQuery.  It takes an optional predicate 
function for the prefilter registration.  If you omit the prefilter, all your $.ajax calls will use
the transport (which is often what you want).  

*buildTransport*

This method constructs a jQuery.ajax transport factory, which can be registered with $.ajaxTransport().

