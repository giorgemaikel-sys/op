#include "tabwidget.h"
#include <QWebEngineView>
#include <QWebEnginePage>
#include <QWebEngineDownloadRequest>
#include <QPushButton>
#include <QHBoxLayout>
#include <QLabel>
#include <QStyle>

TabWidget::TabWidget(QWidget *parent) : QTabWidget(parent)
{
    setTabsClosable(true);
    setMovable(true);
    setDocumentMode(true);
    
    connect(this, &QTabWidget::currentChanged, this, &TabWidget::onCurrentTabChanged);
    connect(this, &QTabWidget::tabCloseRequested, this, &TabWidget::closeTab);
}

TabWidget::~TabWidget()
{
    tabs.clear();
}

QWebEngineView* TabWidget::currentWebView() const
{
    int index = currentIndex();
    if (index >= 0 && index < static_cast<int>(tabs.size())) {
        return tabs[index].webView;
    }
    return nullptr;
}

QWebEngineView* TabWidget::createNewTab(const QUrl &url)
{
    TabInfo tabInfo;
    
    // Create container widget for the tab
    tabInfo.container = new QWidget();
    QHBoxLayout *containerLayout = new QHBoxLayout(tabInfo.container);
    containerLayout->setContentsMargins(0, 0, 0, 0);
    containerLayout->setSpacing(0);
    
    // Create web view
    tabInfo.webView = new QWebEngineView();
    tabInfo.webView->setUrl(url.isEmpty() ? QUrl("about:blank") : url);
    
    // Enable modern web features
    QWebEnginePage *page = tabInfo.webView->page();
    page->settings()->setAttribute(QWebEngineSettings::JavascriptEnabled, true);
    page->settings()->setAttribute(QWebEngineSettings::PluginsEnabled, true);
    page->settings()->setAttribute(QWebEngineSettings::LocalStorageEnabled, true);
    page->settings()->setAttribute(QWebEngineSettings::FullScreenSupportEnabled, true);
    page->settings()->setAttribute(QWebEngineSettings::ScreenCaptureEnabled, true);
    page->settings()->setAttribute(QWebEngineSettings::WebGLEnabled, true);
    page->settings()->setAttribute(QWebEngineSettings::SpatialNavigationEnabled, true);
    page->settings()->setAttribute(QWebEngineSettings::LocalContentCanAccessRemoteUrls, false);
    page->settings()->setAttribute(QWebEngineSettings::AutoLoadImages, true);
    page->settings()->setAttribute(QWebEngineSettings::PlaybackRequiresUserGesture, false);
    
    containerLayout->addWidget(tabInfo.webView);
    
    // Create close button for tab
    tabInfo.closeButton = new QPushButton("×");
    tabInfo.closeButton->setFixedSize(20, 20);
    tabInfo.closeButton->setFlat(true);
    tabInfo.closeButton->setStyleSheet(
        "QPushButton {"
        "    background-color: transparent;"
        "    border: none;"
        "    color: #666;"
        "    font-size: 16px;"
        "    font-weight: bold;"
        "}"
        "QPushButton:hover {"
        "    background-color: #ff4444;"
        "    color: white;"
        "    border-radius: 10px;"
        "}"
    );
    
    // Connect close button
    connect(tabInfo.closeButton, &QPushButton::clicked, this, [this, tabInfo]() {
        int index = getTabIndex(tabInfo.webView);
        if (index >= 0) {
            closeTab(index);
        }
    });
    
    // Create tab label with close button
    QLabel *tabLabel = new QLabel("New Tab");
    QHBoxLayout *labelLayout = new QHBoxLayout();
    labelLayout->setContentsMargins(5, 2, 5, 2);
    labelLayout->setSpacing(5);
    labelLayout->addWidget(tabLabel);
    labelLayout->addWidget(tabInfo.closeButton);
    labelLayout->addStretch();
    
    QWidget *labelWidget = new QWidget();
    labelWidget->setLayout(labelLayout);
    
    addTab(tabInfo.container, "");
    setTabButton(indexOf(tabInfo.container), QTabBar::RightSide, labelWidget);
    
    tabs.push_back(tabInfo);
    
    // Connect signals
    connect(tabInfo.webView, &QWebEngineView::urlChanged, this, &TabWidget::onTabUrlChanged);
    connect(tabInfo.webView, &QWebEngineView::titleChanged, this, &TabWidget::onTabTitleChanged);
    connect(tabInfo.webView, &QWebEngineView::loadProgress, this, &TabWidget::onLoadingProgress);
    connect(tabInfo.webView->page(), &QWebEnginePage::downloadRequested, 
            this, &TabWidget::downloadRequested);
    
    // Set as current tab
    setCurrentWidget(tabInfo.container);
    
    // Trigger initial title update
    onTabTitleChanged(tabInfo.webView->title());
    
    return tabInfo.webView;
}

void TabWidget::closeTab(int index)
{
    if (index < 0 || index >= static_cast<int>(tabs.size())) {
        return;
    }
    
    TabInfo &tabInfo = tabs[index];
    
    // Remove tab from widget
    removeTab(indexOf(tabInfo.container));
    
    // Clean up widgets
    tabInfo.webView->deleteLater();
    tabInfo.container->deleteLater();
    
    // Remove from vector
    tabs.erase(tabs.begin() + index);
    
    // Emit signal if all tabs closed
    if (tabs.empty()) {
        emit allTabsClosed();
    }
}

int TabWidget::getTabIndex(QWebEngineView *view) const
{
    for (size_t i = 0; i < tabs.size(); ++i) {
        if (tabs[i].webView == view) {
            return static_cast<int>(i);
        }
    }
    return -1;
}

void TabWidget::onCurrentTabChanged(int index)
{
    if (index >= 0 && index < static_cast<int>(tabs.size())) {
        QWebEngineView *webView = tabs[index].webView;
        if (webView) {
            emit urlChanged(webView->url());
            emit titleChanged(webView->title());
            emit loadingProgress(webView->isLoading() ? webView->loadProgress() : 100);
        }
    }
}

void TabWidget::onTabTitleChanged(const QString &title)
{
    QWebEngineView *webView = qobject_cast<QWebEngineView*>(sender());
    if (!webView) return;
    
    int index = getTabIndex(webView);
    if (index >= 0) {
        QString displayTitle = title.isEmpty() ? "New Tab" : title;
        setTabText(index, displayTitle.left(20) + (displayTitle.length() > 20 ? "..." : ""));
        setTabToolTip(index, title);
        
        if (currentIndex() == index) {
            emit titleChanged(title);
        }
    }
}

void TabWidget::onTabUrlChanged(const QUrl &url)
{
    QWebEngineView *webView = qobject_cast<QWebEngineView*>(sender());
    if (!webView) return;
    
    int index = getTabIndex(webView);
    if (index >= 0 && currentIndex() == index) {
        emit urlChanged(url);
    }
}

void TabWidget::onLoadingProgress(int progress)
{
    QWebEngineView *webView = qobject_cast<QWebEngineView*>(sender());
    if (!webView) return;
    
    int index = getTabIndex(webView);
    if (index >= 0 && currentIndex() == index) {
        emit loadingProgress(progress);
    }
}

void TabWidget::closeTabButtonClicked()
{
    QPushButton *button = qobject_cast<QPushButton*>(sender());
    if (!button) return;
    
    // Find which tab this button belongs to and close it
    for (int i = 0; i < count(); ++i) {
        QWidget *tabButton = tabButton(i, QTabBar::RightSide);
        if (tabButton && button == tabButton) {
            closeTab(i);
            break;
        }
    }
}

void TabWidget::updateTabCloseButtons()
{
    // Update visibility of close buttons based on tab count
    bool showClose = count() > 1;
    for (size_t i = 0; i < tabs.size(); ++i) {
        if (tabs[i].closeButton) {
            tabs[i].closeButton->setVisible(showClose || count() == 1);
        }
    }
}
