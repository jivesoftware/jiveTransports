-Jive Transport

This project collects jQuery Transports designed to be used with the Jive Application Framework.

The common interface is simple.  

**register(config, [predicate])**

This method constructs a transport and registers it with jQuery.  It takes an optional predicate 
function for the prefilter registration.  If you omit the prefilter, all your $.ajax calls will use
the transport (which is often what you want).

`config` is a transport-specific config param.

`predicate` is a function(options, originalOptions, jqXHR) that returns true if a given request should be
routed through this transport, false otherwise.  The predicate defaults to always-true.

**buildTransport(config)**

This method constructs a jQuery.ajax transport factory, which can be registered with $.ajaxTransport().
This is the "low-level" interface, provided so that you can do arbitrarily complex things with
$.ajaxPrefilter and $.ajaxTransport.  Most of the time, register is sufficient.

`config` is a transport-specific config param.