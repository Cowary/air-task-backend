package org.cowary.airtaskbackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.cowary.airtaskbackend.api.planko.CustomFieldGroupsApi;
import org.cowary.airtaskbackend.api.planko.CustomFieldsApi;
import org.cowary.airtaskbackend.model.planko.CreateBoardCustomFieldGroup200Response;
import org.cowary.airtaskbackend.model.planko.CreateCardCustomFieldGroupRequest;
import org.cowary.airtaskbackend.model.planko.CustomFieldGroup;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomFieldService {
    private final CustomFieldsApi customFieldsApi;
    private final CustomFieldGroupsApi customFieldGroupsApi;
    private final CardService cardService;

    public Long createOrGetCustomFieldGroup(Long cardId, String groupFieldName, String customFieldName) {
        var card = cardService.getCard(cardId);
        var groupFieldList = card.getIncluded().getCustomFieldGroups();
        Long groupFieldId = null;
        if (!groupFieldList.stream().map(CustomFieldGroup::getName).toList().contains(groupFieldName)) {
            var group = createCustomFieldGroup(groupFieldId, groupFieldName);
            groupFieldId = Long.valueOf(group.getItem().getId());
        } else {
            groupFieldId = groupFieldList.stream().map(CustomFieldGroup::getName).filter(c -> c.equals(groupFieldName)).findFirst().map(Long::valueOf).orElse(null);
        }
        if (groupFieldId == null) {
            throw new IllegalStateException("");
        }
        return groupFieldId;
    }

    public void createCustomField(Long cardId, Long groupFieldId, String customFieldName) {}

    public CreateBoardCustomFieldGroup200Response createCustomFieldGroup(Long cardId, String groupFieldName) {
        CreateCardCustomFieldGroupRequest rq = new CreateCardCustomFieldGroupRequest();
        rq.setName(groupFieldName);
        rq.setPosition(BigDecimal.valueOf(1));
        return customFieldGroupsApi.createCardCustomFieldGroup(String.valueOf(cardId), rq);
    }
}
