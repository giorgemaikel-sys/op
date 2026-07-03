#include <QApplication>
#include <QWebEngineProfile>
#include <QWebEngineSettings>
#include <QIcon>
#include <QStyleFactory>
#include "browser.h"

int main(int argc, char *argv[])
{
    // Enable high DPI scaling for modern displays
    QApplication::setAttribute(Qt::AA_EnableHighDpiScaling);
    QApplication::setAttribute(Qt::AA_UseHighDpiPixmaps);
    
    #if QT_VERSION >= QT_VERSION_CHECK(5, 14, 0)
    QApplication::setHighDpiScaleFactorRoundingPolicy(
        Qt::HighDpiScaleFactorRoundingPolicy::PassThrough);
    #endif
    
    QApplication app(argc, argv);
    
    // Set application info
    QApplication::setApplicationName("Modern Browser");
    QApplication::setApplicationVersion("1.0");
    QApplication::setOrganizationName("ModernBrowser");
    
    // Set modern style
    QApplication::setStyle(QStyleFactory::create("Fusion"));
    
    // Configure global web engine settings
    QWebEngineProfile *defaultProfile = QWebEngineProfile::defaultProfile();
    
    // Enable modern web features globally
    QWebEngineSettings *globalSettings = defaultProfile->settings();
    globalSettings->setAttribute(QWebEngineSettings::JavascriptEnabled, true);
    globalSettings->setAttribute(QWebEngineSettings::JavascriptCanOpenWindows, true);
    globalSettings->setAttribute(QWebEngineSettings::JavascriptCanAccessClipboard, true);
    globalSettings->setAttribute(QWebEngineSettings::LocalStorageEnabled, true);
    globalSettings->setAttribute(QWebEngineSettings::WebGLEnabled, true);
    globalSettings->setAttribute(QWebEngineSettings::FullScreenSupportEnabled, true);
    globalSettings->setAttribute(QWebEngineSettings::ScreenCaptureEnabled, true);
    globalSettings->setAttribute(QWebEngineSettings::PluginsEnabled, true);
    globalSettings->setAttribute(QWebEngineSettings::AutoLoadImages, true);
    globalSettings->setAttribute(QWebEngineSettings::PlaybackRequiresUserGesture, false);
    globalSettings->setAttribute(QWebEngineSettings::SpatialNavigationEnabled, true);
    globalSettings->setAttribute(QWebEngineSettings::CssGridLayoutEnabled, true);
    globalSettings->setAttribute(QWebEngineSettings::ScrollAnimatorEnabled, true);
    
    // Set a modern user agent
    QString userAgent = defaultProfile->httpUserAgent();
    // You can customize the user agent here if needed
    
    // Create and show browser window
    Browser browser;
    browser.show();
    
    return app.exec();
}
