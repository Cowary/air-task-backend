package org.cowary.airtaskbackend.rest.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectDto {
    private Long id;
    private String name;
    private String status;
    private String priority;
    private List<Long> weeklyIdList;
}