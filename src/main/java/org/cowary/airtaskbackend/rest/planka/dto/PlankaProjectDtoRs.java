package org.cowary.airtaskbackend.rest.planka.dto;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PlankaProjectDtoRs {
    Long id;
    String name;
    List<BoardRs> boardList;
}
