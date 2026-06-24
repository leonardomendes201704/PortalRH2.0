import { getCarouselData } from "./carouselService.js";
import { getFeedData } from "./feedService.js";
import { getPanelData } from "./panelService.js";
import { getPollCenterData } from "./pollService.js";
import { getPortalAuthHeaders } from "./portalAuthService.js";
import { getUserHomeContext } from "./userService.js";
import { applyAgendaToShellData, getAgendaDayData } from "./agendaService.js";
import { applyNotificationsToShellData, getNotificationCenterData } from "./notificationService.js";
import { getMoodSurveyToday, mapMoodSurveyToViewModel } from "./moodSurveyService.js";

export async function getHomePageData() {
  const [userContext, carousel, feed, panels, polls, notifications, agenda, moodSurvey] = await Promise.all([
    getUserHomeContext(),
    getCarouselData(),
    getFeedData(),
    getPanelData(),
    getPollCenterData({
      headers: getPortalAuthHeaders()
    }),
    getNotificationCenterData(),
    getAgendaDayData(),
    getMoodSurveyToday().catch((error) => {
      console.warn("Falha ao carregar pesquisa de humor. Usando fallback local.", error);
      return null;
    })
  ]);

  const mood = moodSurvey
    ? mapMoodSurveyToViewModel(moodSurvey)
    : userContext.mood;

  return applyAgendaToShellData(applyNotificationsToShellData({
    ...userContext,
    mood,
    carousel,
    feed,
    pollHomeCarousel: polls.homePolls,
    ...panels
  }, notifications), agenda);
}
