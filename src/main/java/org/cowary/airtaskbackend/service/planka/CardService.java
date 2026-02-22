package org.cowary.airtaskbackend.service.planka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.cowary.airtaskbackend.api.planko.CardsApi;
import org.cowary.airtaskbackend.model.planko.CreateCard200Response;
import org.cowary.airtaskbackend.model.planko.CreateCardRequestStopwatch;
import org.cowary.airtaskbackend.model.planko.GetCard200Response;
import org.cowary.airtaskbackend.model.planko.UpdateCardRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CardService {
    private final CardsApi cardsApi;

    public GetCard200Response getCard(Long cardId) {
        return cardsApi.getCard(String.valueOf(cardId));
    }

    public CreateCard200Response updateTimerCard(Long cardId, Long addTime) {
        var card = getCard(cardId);
        var timer = card.getItem().getStopwatch();

        UpdateCardRequest rq = new UpdateCardRequest();
        rq.setBoardId(card.getItem().getBoardId());
        rq.setName(card.getItem().getName());
        rq.setListId(card.getItem().getListId());
//        rq.setDescription(card.getItem().getDescription());
//        rq.setDescription("");
//        rq.setCoverAttachmentId(card.getItem().getCoverAttachmentId());
//        rq.setCoverAttachmentId("");
//        rq.dueDate(card.getItem().getDueDate());
        rq.setIsDueCompleted(card.getItem().getIsDueCompleted());
        rq.setIsSubscribed(card.getItem().getIsSubscribed());
//        rq.setPosition(card.getItem().getPosition());
//        rq.setPosition(BigDecimal.ONE);
        rq.setType(UpdateCardRequest.TypeEnum.fromValue(card.getItem().getType().toString()));
        CreateCardRequestStopwatch ts = new CreateCardRequestStopwatch();
//        ts.setStartedAt(Optional.ofNullable(timer).map(CreateCardRequestStopwatch::getStartedAt).orElse(OffsetDateTime.now().minusDays(10)));
        ts.setStartedAt(null);
        ts.setTotal(Optional.ofNullable(timer).map(CreateCardRequestStopwatch::getTotal).orElse(BigDecimal.ZERO).add(BigDecimal.valueOf(addTime)));
        rq.setStopwatch(ts);
        return cardsApi.updateCard(String.valueOf(cardId), rq);
    }
}
