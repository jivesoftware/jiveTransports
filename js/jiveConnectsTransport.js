/*
 * Copyright (c) 2013 Jive Software. All rights reserved.
 *
 * This software is the proprietary information of Jive Software. Use is subject to license terms.
 */

/**
 * Connects jQuery.ajax custom transport module.  In the simplest case, just call
 * <code>JiveConnectsTransport.register("myConnectsAlias");</code>
 */
define(["jquery"], function ($) {
    function buildConnectsTransport(connectsAlias){
        var configurationPromise = null;
        return function connectsTransport(options, originalOptions, jqXHR){
            var aborted = false;
            options.dataTypes.shift(); //get rid of the "backbone" datatype.
            return {
                send: function sendViaConnects(headers, completeCallback){
                    if(!aborted){
                        //Set up the Jive Connects request
                        var connectsParams = {
                            alias: connectsAlias,
                            href: options.url
                        };
                        var method = options.type.toLowerCase();
                        if(method == "put" || method == "post"){
                            connectsParams.body = options.data;
                        }

                        var connectsRequest = osapi.jive.connects[method](connectsParams);

                        function connectsCallback(response){
                            //Translate the Jive Connects response into a jQuery.ajax response.
                            var statusCode = response.status,
                                statusText = (response.error && response.error.message) || "OK",
                                headers = response.headers,
                                responses = {
                                    json: response.content //connects parses this for us
                                };
                            if (response.error && response.error.code == 401) {
                                console.log("got a 401", configurationPromise);
                                //Make sure config isn't already in process
                                if(!configurationPromise){
                                    configurationPromise = new $.Deferred();

                                    // Request Jive to configure (or reconfigure) credentials for this connection
                                    osapi.jive.connects.reconfigure(connectsAlias, response, function(feedback) {
                                        console.log("auth results: ", arguments);
                                        if(feedback.authorized){
                                            // When we've reconfigured, retry all the requests that failed with 401
                                            configurationPromise.resolve();
                                        }else{
                                            console.log("authorization failed: ", feedback);
                                            configurationPromise.reject();
                                            configurationPromise = null;
                                        }
                                    });
                                }
                                //Schedule the original request for retry when the configuration succeeds.
                                configurationPromise.then(function(){
                                    connectsRequest.execute(connectsCallback); // Resubmit the failed request
                                }, function(){
                                    console.log("Authorization failed, request will not be retried", connectsRequest);
                                });

                            }else{
                                completeCallback(statusCode, statusText, responses, headers);
                            }
                        }

                        //Make the request
                        connectsRequest.execute(connectsCallback);
                    }
                },
                abort: function abortConnectsRequest(){
                    aborted = true;
                }
            };
        };
    }

    function registerConnectsTransport(connectsAlias, prefilterPredicate){
        var pseudoDataType = "connects-" + connectsAlias,
            producteevConnectsTransport = buildConnectsTransport(connectsAlias);

        if(!prefilterPredicate){
            //By default, route all ajax calls to the connects transport
            prefilterPredicate = function(){ return true; };
        }

        function connectsPrefilter(options, originalOptions, jqXHR){
            if(prefilterPredicate(options, originalOptions, jqXHR)){
                return  pseudoDataType;
            }
        }

        $.ajaxPrefilter(connectsPrefilter);
        $.ajaxTransport(pseudoDataType, producteevConnectsTransport);
    }

    return {
        buildTransport: buildConnectsTransport,
        register: registerConnectsTransport
    };
});