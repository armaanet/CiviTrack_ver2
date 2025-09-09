package com.civictrack.service;

import com.civictrack.model.Complaint;
import com.civictrack.model.dto.EmployeeDTO;
import com.civictrack.repository.ComplaintRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    public Complaint createComplaint(Complaint complaint) {
        // The @PrePersist annotation in the entity will set the createdAt timestamp
        return complaintRepository.save(complaint);
    }

    public Complaint assignEmployee(Long id, EmployeeDTO employeeDTO) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Complaint not found with id: " + id));
        
        complaint.setAssignedEmployeeName(employeeDTO.getName());
        complaint.setAssignedEmployeeContact(employeeDTO.getContact());
        complaint.setStatus("In Progress"); // Automatically set status when assigning
        
        return complaintRepository.save(complaint);
    }
    
    public Complaint updateStatus(Long id, String newStatus) {
         Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Complaint not found with id: " + id));
        
        complaint.setStatus(newStatus);
        
        return complaintRepository.save(complaint);
    }
    
    public Complaint resolveComplaint(Long id, String resolvedImageUrl) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Complaint not found with id: " + id));
        
        complaint.setResolvedImageUrl(resolvedImageUrl);
        complaint.setStatus("Resolved");
        complaint.setResolvedAt(LocalDateTime.now());

        return complaintRepository.save(complaint);
    }
}
