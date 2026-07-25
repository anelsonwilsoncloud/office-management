package com.office.officemanagement.desktop;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.net.URI;

/**
 * Integrates the app with the desktop when running as a native installer.
 * <p>
 * On startup it:
 * <ul>
 *   <li>Opens the default browser at {@code http://localhost:<port>}</li>
 *   <li>Installs a system-tray icon with "Open" and "Quit" menu items</li>
 * </ul>
 * Both features are silently skipped in headless environments (Docker, CI).
 */
@Component
public class DesktopIntegration {

    private static final Logger log = LoggerFactory.getLogger(DesktopIntegration.class);

    @Value("${server.port:8080}")
    private int port;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (GraphicsEnvironment.isHeadless()) {
            log.debug("Headless environment – skipping desktop integration");
            return;
        }
        String appUrl = "http://localhost:" + port;
        openBrowser(appUrl);
        EventQueue.invokeLater(() -> setupSystemTray(appUrl));
    }

    private void openBrowser(String url) {
        try {
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(URI.create(url));
            }
        } catch (Exception e) {
            log.warn("Could not open browser automatically: {}", e.getMessage());
        }
    }

    private void setupSystemTray(String url) {
        if (!SystemTray.isSupported()) {
            return;
        }
        try {
            PopupMenu menu = new PopupMenu();

            MenuItem openItem = new MenuItem("Open Office Management");
            openItem.addActionListener(e -> openBrowser(url));
            menu.add(openItem);

            menu.addSeparator();

            MenuItem quitItem = new MenuItem("Quit");
            quitItem.addActionListener(e -> System.exit(0));
            menu.add(quitItem);

            TrayIcon trayIcon = new TrayIcon(loadTrayIcon(), "Office Management", menu);
            trayIcon.setImageAutoSize(true);
            trayIcon.addActionListener(e -> openBrowser(url)); // double-click also opens browser

            SystemTray.getSystemTray().add(trayIcon);
            log.info("System tray icon installed – right-click to open the app or quit");
        } catch (Exception e) {
            log.warn("Could not install system tray icon: {}", e.getMessage());
        }
    }

    /** Loads the bundled favicon; falls back to a transparent placeholder on failure. */
    private Image loadTrayIcon() {
        try {
            var iconUrl = getClass().getResource("/static/favicon.ico");
            if (iconUrl != null) {
                return Toolkit.getDefaultToolkit().getImage(iconUrl);
            }
        } catch (Exception ignored) {
            // fall through to fallback
        }
        return new BufferedImage(16, 16, BufferedImage.TYPE_INT_ARGB);
    }
}
