package org.cowary.airtaskbackend.rest.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;

@Data
@Builder
@AllArgsConstructor
@Getter
public class ApiResponse<T> {
    Boolean isSuccess;
    String errorMessage;
    ErrorType errorType;
    T data;
}
