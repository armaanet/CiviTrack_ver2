package com.civictrack.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResolveDTO {
    @NotBlank(message = "Resolution image URL cannot be blank")
    private String resolvedImageUrl;
}
