import { Plugin } from "@utils/pluginBase";
import type { MessageContext } from "@mtcute/dispatcher";
import axios from "axios";
import { getGlobalClient } from "@utils/runtimeManager";
import { logger } from "@utils/logger";

const url = "https://api.52vmy.cn/api/wl/moyu";

const CN_TIME_ZONE = "Asia/Shanghai";

function formatCN(date: Date): string {
  return date.toLocaleString("zh-CN", { timeZone: CN_TIME_ZONE });
}

class MoyuPlugin extends Plugin {

  description: string = "摸鱼日报";
  cmdHandlers: Record<string, (msg: MessageContext) => Promise<void>> = {
    moyu: async (msg) => {
      try {
        await msg.edit({ text: "开摸..." });
        const caption = `摸鱼日报 ${formatCN(new Date())}`;

        const res = await axios.get(url, {
          responseType: "arraybuffer",
          validateStatus: () => true,
          timeout: 15000,
        });

        if (res.status < 200 || res.status >= 300) {
          throw new Error(`HTTP ${res.status}`);
        }

        const buf = Buffer.from(res.data);
        if (buf.length < 100) {
          throw new Error("返回内容过短，可能不是有效图片");
        }

        const client = await getGlobalClient();
        await client.sendMedia(msg.chat.id, {
          type: "photo",
          file: buf,
          fileName: "moyu.jpg",
          caption,
        });
        await msg.delete().catch(() => {
          /* message may already be gone */
        });
      } catch (error: unknown) {
        logger.error("[MoyuPlugin] 执行失败:", error);
        try {
          await msg.edit({ text: "❌ 获取摸鱼日报失败，请稍后重试" });
        } catch {
          /* ignore edit failure */
        }
      }
    },
  };
}

const plugin = new MoyuPlugin();

export default plugin;
