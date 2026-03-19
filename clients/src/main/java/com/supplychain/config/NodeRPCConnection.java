package com.supplychain.config;

import net.corda.client.rpc.CordaRPCClient;
import net.corda.client.rpc.CordaRPCConnection;
import net.corda.core.messaging.CordaRPCOps;
import net.corda.core.utilities.NetworkHostAndPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

/**
 * Manages the RPC connection to the Corda node.
 * Spring creates one instance of this bean on startup and keeps it alive.
 * The connection is closed cleanly when the application shuts down.
 *
 * Configure via application.properties:
 *   corda.host, corda.rpcPort, corda.username, corda.password
 */
@Component
public class NodeRPCConnection {

    private static final Logger logger = LoggerFactory.getLogger(NodeRPCConnection.class);

    @Value("${corda.host}")
    private String host;

    @Value("${corda.rpcPort}")
    private int rpcPort;

    @Value("${corda.username}")
    private String username;

    @Value("${corda.password}")
    private String password;

    private CordaRPCConnection rpcConnection;
    private CordaRPCOps proxy;

    @PostConstruct
    public void initialize() {
        logger.info("Connecting to Corda node at {}:{}", host, rpcPort);
        NetworkHostAndPort rpcAddress = new NetworkHostAndPort(host, rpcPort);
        CordaRPCClient client = new CordaRPCClient(rpcAddress);
        rpcConnection = client.start(username, password);
        proxy = rpcConnection.getProxy();
        logger.info("Connected to Corda node. Identity: {}",
                proxy.nodeInfo().getLegalIdentities().get(0).getName().getOrganisation());
    }

    /**
     * Returns the RPC proxy used to interact with the Corda node.
     */
    public CordaRPCOps getProxy() {
        return proxy;
    }

    @PreDestroy
    public void close() {
        logger.info("Closing Corda RPC connection...");
        if (rpcConnection != null) {
            rpcConnection.notifyServerAndClose();
        }
    }
}
