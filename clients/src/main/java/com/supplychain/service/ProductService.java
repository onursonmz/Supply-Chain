package com.supplychain.service;

import com.supplychain.config.NodeRPCConnection;
import com.supplychain.dto.ProductResponse;
import com.supplychain.flows.CreateProductFlow;
import com.supplychain.flows.TransferProductFlow;
import com.supplychain.states.ProductState;
import net.corda.core.contracts.UniqueIdentifier;
import net.corda.core.identity.Party;
import net.corda.core.messaging.CordaRPCOps;
import net.corda.core.node.services.Vault;
import net.corda.core.node.services.vault.QueryCriteria;
import net.corda.core.transactions.SignedTransaction;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service layer that communicates with the Corda node via RPC.
 * All flow invocations and vault queries go through this class.
 */
@Service
public class ProductService {

    private final CordaRPCOps proxy;

    public ProductService(NodeRPCConnection rpcConnection) {
        this.proxy = rpcConnection.getProxy();
    }

    // -------------------------------------------------------------------------
    // Create
    // -------------------------------------------------------------------------

    /**
     * Creates a new product on the ledger.
     * The owner is automatically set to the node this backend is connected to.
     */
    public ProductResponse createProduct(String productName, String serialNumber) throws Exception {
        // The owner of a newly created product is always this node
        Party owner = proxy.nodeInfo().getLegalIdentities().get(0);

        SignedTransaction tx = proxy
                .startFlowDynamic(CreateProductFlow.class, productName, serialNumber, owner)
                .getReturnValue()
                .get();

        ProductState state = (ProductState) tx.getCoreTransaction().getOutputs().get(0).getData();
        return ProductResponse.from(state);
    }

    // -------------------------------------------------------------------------
    // Transfer
    // -------------------------------------------------------------------------

    /**
     * Transfers a product to a new owner.
     *
     * @param linearId  the product's unique ID (UUID string)
     * @param newOwnerName  short organisation name, e.g. "Distributor"
     */
    public ProductResponse transferProduct(String linearId, String newOwnerName) throws Exception {
        // Look up the party by short name from the Corda network map
        Set<Party> parties = proxy.partiesFromName(newOwnerName, false);
        if (parties.isEmpty()) {
            throw new IllegalArgumentException("No party found with name: " + newOwnerName);
        }
        Party newOwner = parties.iterator().next();

        UniqueIdentifier uid = new UniqueIdentifier(null, UUID.fromString(linearId));

        SignedTransaction tx = proxy
                .startFlowDynamic(TransferProductFlow.class, uid, newOwner)
                .getReturnValue()
                .get();

        ProductState state = (ProductState) tx.getCoreTransaction().getOutputs().get(0).getData();
        return ProductResponse.from(state);
    }

    // -------------------------------------------------------------------------
    // Query
    // -------------------------------------------------------------------------

    /**
     * Returns all unconsumed products visible to this node.
     */
    public List<ProductResponse> getAllProducts() {
        return proxy.vaultQuery(ProductState.class)
                .getStates()
                .stream()
                .map(stateAndRef -> ProductResponse.from(stateAndRef.getState().getData()))
                .collect(Collectors.toList());
    }

    /**
     * Returns a single product by its linearId.
     */
    public ProductResponse getProductById(String linearId) {
        List<UUID> uuids = Collections.singletonList(UUID.fromString(linearId));

        QueryCriteria criteria = new QueryCriteria.LinearStateQueryCriteria(
                null, uuids, null, Vault.StateStatus.UNCONSUMED
        );

        List<ProductState> states = proxy
                .vaultQueryByCriteria(criteria, ProductState.class)
                .getStates()
                .stream()
                .map(s -> s.getState().getData())
                .collect(Collectors.toList());

        if (states.isEmpty()) {
            throw new IllegalArgumentException("Product not found: " + linearId);
        }
        return ProductResponse.from(states.get(0));
    }

    /**
     * Returns the organisation name of this node (e.g. "Manufacturer").
     */
    public String getMyNodeName() {
        return proxy.nodeInfo().getLegalIdentities().get(0).getName().getOrganisation();
    }
}
