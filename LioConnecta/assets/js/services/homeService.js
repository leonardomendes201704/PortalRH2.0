import { getCarouselData } from "./carouselService.js";
import { getFeedData } from "./feedService.js";
import { getPanelData } from "./panelService.js";
import { getPollCenterData } from "./pollService.js";
import { getPortalAuthHeaders } from "./portalAuthService.js";
import { getUserHomeContext } from "./userService.js";

export async function getHomePageData() {
  const [userContext, carousel, feed, panels, polls] = await Promise.all([
    getUserHomeContext(),
    getCarouselData(),
    getFeedData(),
    getPanelData(),
    getPollCenterData({
      headers: getPortalAuthHeaders()
    })
  ]);

  return {
    ...userContext,
    carousel,
    feed,
    pollHighlight: polls.featured,
    ...panels
  };
}
