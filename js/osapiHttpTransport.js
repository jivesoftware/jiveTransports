/*
 * Copyright (c) 2013 Jive Software. All rights reserved.
 *
 * This software is the proprietary information of Jive Software. Use is subject to license terms.
 */

/**
 * @class OsapiHttpTransport
 *
 * OSAPI jQuery.ajax custom transport module.  In the simplest case, just call
 * <code>OsapiHttpTransport.register();</code>
 */
define(["jquery"], function ($) {
    function buildOsapiTransport(requestOptions){
        return function connectsTransport(options, originalOptions, jqXHR){
            var aborted = false;
            options.dataTypes.shift(); //get rid of the "backbone" datatype.
            return {
                send: function sendViaConnects(headers, jqueryCallback){
                    if(!aborted){
                        //Set up the Jive Connects request
                        var osapiParams = $.extend({}, requestOptions, {
                            href: options.url
                        });
                        var method = options.type.toLowerCase();
                        if(method == "put" || method == "post"){
                            osapiParams.body = options.data;
                        }

                        var request = osapi.http[method](osapiParams);

                        function osapiCallback(response){
                            //Translate the Jive Connects response into a jQuery.ajax response.
                            var statusCode = response.status,
                                statusText = (response.error && response.error.message) || "OK",
                                headers = response.headers,
                                responses = {
                                    json: response.content //connects parses this for us
                                };
                            jqueryCallback(statusCode, statusText, responses, headers);
                        }

                        //Make the request
                        request.execute(osapiCallback);
                    }
                },
                abort: function abortRequest(){
                    aborted = true;
                }
            };
        };
    }

    function registerTransport(options, prefilterPredicate){
        options = $.extend({
            tag: "default",
            requestOptions: {}
        }, options);
        var pseudoDataType = "osapi-http-" + options.tag,
            transport = buildOsapiTransport(options.requestOptions);

        if(!prefilterPredicate){
            //By default, route all ajax calls to the connects transport
            prefilterPredicate = function(){ return true; };
        }

        function prefilter(options, originalOptions, jqXHR){
            if(prefilterPredicate(options, originalOptions, jqXHR)){
                return  pseudoDataType;
            }
        }

        $.ajaxPrefilter(prefilter);
        $.ajaxTransport(pseudoDataType, transport);
    }

    return {
        /**
         * @method
         * build the transport factory
         * @param requestOptions OSAPI request parameters. See http://opensocial-resources.googlecode.com/svn/spec/1.0/Core-Data.xml#HTTP-Request-Parameters
         */
        buildTransport: buildOsapiTransport,
        /**
         * @method
         * register the transport
         * @param options {tag: "default", requestOptions: {}}
         */
        register: registerTransport
    };
});