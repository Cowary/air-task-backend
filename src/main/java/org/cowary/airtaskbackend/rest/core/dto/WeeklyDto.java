package org.cowary.airtaskbackend.rest.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WeeklyDto {
    private Long id;
    private String name;
    private Integer count;
    private Long projectId;
    private String status;
    private String priority;
}
