import { getCarouselData } from "./carouselService.js";
import { getFeedData } from "./feedService.js";
import { getPanelData } from "./panelService.js";
import { getUserHomeContext } from "./userService.js";

export async function getHomePageData() {
  const [userContext, carousel, feed, panels] = await Promise.all([
    getUserHomeContext(),
    getCarouselData(),
    getFeedData(),
    getPanelData()
  ]);

  return {
    ...userContext,
    carousel,
    feed,
    ...panels
  };
}
