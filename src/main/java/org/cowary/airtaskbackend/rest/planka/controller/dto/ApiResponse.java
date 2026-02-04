package org.cowary.airtaskbackend.rest.planka.controller.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApiResponse<T> {
    Boolean isSuccess;
    String errorMessage;
    ErrorType errorType;
    T data;
}
