package com.supplychain.service;

import com.supplychain.dto.CreateDistributorOrderRequest;
import com.supplychain.dto.DistributorOrderResponse;
import com.supplychain.entity.DistributorOrder;
import com.supplychain.entity.Organization;
import com.supplychain.repository.DistributorOrderRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DistributorOrderService {

    private final DistributorOrderRepository orderRepo;
    private final OrganizationService        orgService;

    public DistributorOrderService(DistributorOrderRepository orderRepo,
                                    OrganizationService orgService) {
        this.orderRepo  = orderRepo;
        this.orgService = orgService;
    }

    public DistributorOrderResponse createOrder(CreateDistributorOrderRequest req,
                                                 String distributorOrgId, String distributorOrgName,
                                                 String createdBy) {
        if (req.getMedicineName() == null || req.getMedicineName().isBlank())
            throw new IllegalArgumentException("İlaç adı zorunludur.");
        if (req.getQuantity() < 1)
            throw new IllegalArgumentException("Miktar en az 1 olmalıdır.");
        if (req.getManufacturerOrgId() == null || req.getManufacturerOrgId().isBlank())
            throw new IllegalArgumentException("Üretici seçimi zorunludur.");

        Organization mfr = orgService.findEntityById(req.getManufacturerOrgId());

        DistributorOrder order = new DistributorOrder();
        order.setOrderId(UUID.randomUUID().toString());
        order.setDistributorOrgId(distributorOrgId);
        order.setDistributorOrgName(distributorOrgName);
        order.setManufacturerOrgId(mfr.getOrganizationId());
        order.setManufacturerOrgName(mfr.getOrganizationName());
        order.setMedicineName(req.getMedicineName());
        order.setQuantity(req.getQuantity());
        order.setDescription(req.getDescription());
        order.setStatus("PENDING");
        order.setCreatedBy(createdBy);
        order.setCreatedAt(LocalDateTime.now());

        return DistributorOrderResponse.from(orderRepo.save(order));
    }

    public DistributorOrderResponse approveOrder(String orderId, String processedBy) {
        DistributorOrder order = findById(orderId);
        if (!"PENDING".equals(order.getStatus()))
            throw new IllegalStateException("Yalnızca bekleyen talepler onaylanabilir.");
        order.setStatus("APPROVED");
        order.setProcessedBy(processedBy);
        order.setProcessedAt(LocalDateTime.now());
        return DistributorOrderResponse.from(orderRepo.save(order));
    }

    public DistributorOrderResponse rejectOrder(String orderId, String processedBy, String reason) {
        DistributorOrder order = findById(orderId);
        if (!"PENDING".equals(order.getStatus()))
            throw new IllegalStateException("Yalnızca bekleyen talepler reddedilebilir.");
        order.setStatus("REJECTED");
        order.setProcessedBy(processedBy);
        order.setProcessedAt(LocalDateTime.now());
        order.setRejectionReason(reason);
        return DistributorOrderResponse.from(orderRepo.save(order));
    }

    public List<DistributorOrderResponse> getMyOrders(String distributorOrgId) {
        return orderRepo.findByDistributorOrgIdOrderByCreatedAtDesc(distributorOrgId)
                .stream().map(DistributorOrderResponse::from).collect(Collectors.toList());
    }

    public List<DistributorOrderResponse> getIncomingOrders(String manufacturerOrgId) {
        return orderRepo.findByManufacturerOrgIdOrderByCreatedAtDesc(manufacturerOrgId)
                .stream().map(DistributorOrderResponse::from).collect(Collectors.toList());
    }

    public List<DistributorOrderResponse> getAllOrders() {
        return orderRepo.findAllByOrderByCreatedAtDesc()
                .stream().map(DistributorOrderResponse::from).collect(Collectors.toList());
    }

    public long countPendingForManufacturer(String manufacturerOrgId) {
        return orderRepo.countByManufacturerOrgIdAndStatus(manufacturerOrgId, "PENDING");
    }

    private DistributorOrder findById(String id) {
        return orderRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadı: " + id));
    }
}
