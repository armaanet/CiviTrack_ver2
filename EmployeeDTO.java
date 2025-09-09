package com.civictrack.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmployeeDTO {
    @NotBlank(message = "Employee name cannot be blank")
    private String name;

    @NotBlank(message = "Employee contact cannot be blank")
    private String contact;
}
