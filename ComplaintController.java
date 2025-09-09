package com.civictrack.controller;

import com.civictrack.model.Complaint;
import com.civictrack.model.dto.EmployeeDTO;
import com.civictrack.model.dto.ResolveDTO;
import com.civictrack.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    // Endpoint for the user portal to create a new complaint
    @PostMapping
    public Complaint createComplaint(@Valid @RequestBody Complaint complaint) {
        return complaintService.createComplaint(complaint);
    }

    // Endpoint for both portals to get all complaints
    @GetMapping
    public List<Complaint> getAllComplaints() {
        return complaintService.getAllComplaints();
    }

    // Endpoint for the admin portal to assign an employee
    @PutMapping("/{id}/assign")
    public ResponseEntity<Complaint> assignEmployee(@PathVariable Long id, @Valid @RequestBody EmployeeDTO employeeDTO) {
        Complaint updatedComplaint = complaintService.assignEmployee(id, employeeDTO);
        return ResponseEntity.ok(updatedComplaint);
    }
    
    // Endpoint for the admin portal to update status (e.g., to 'In Progress' or to reopen)
    @PutMapping("/{id}/status")
    public ResponseEntity<Complaint> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> statusMap) {
        Complaint updatedComplaint = complaintService.updateStatus(id, statusMap.get("status"));
        return ResponseEntity.ok(updatedComplaint);
    }
    
    // Endpoint for the admin portal to resolve a complaint with proof
    @PutMapping("/{id}/resolve")
     public ResponseEntity<Complaint> resolveComplaint(@PathVariable Long id, @Valid @RequestBody ResolveDTO resolveDTO) {
        Complaint updatedComplaint = complaintService.resolveComplaint(id, resolveDTO.getResolvedImageUrl());
        return ResponseEntity.ok(updatedComplaint);
    }
}
