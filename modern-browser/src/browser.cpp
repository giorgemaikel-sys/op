#include "browser.h"
#include "tabwidget.h"
#include "addressbar.h"
#include "downloadmanager.h"
#include <QApplication>
#include <QWebEngineView>
#include <QWebEnginePage>
#include <QWebEngineSettings>
#include <QWebEngineProfile>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QToolBar>
#include <QStatusBar>
#include <QMenuBar>
#include <QMenu>
#include <QAction>
#include <QActionGroup>
#include <QKeySequence>
#include <QShortcut>
#include <QMessageBox>
#include <QFileDialog>
#include <QInputDialog>
#include <QStyleFactory>
#include <QIcon>

Browser::Browser(QWidget *parent)
    : QMainWindow(parent)
{
    setupUI();
    setupMenuBar();
    setupToolBar();
    setupStatusBar();
    setupConnections();
    loadStyleSheet();
    
    // Create initial tab
    createNewTab();
    
    // Set window properties
    setWindowTitle("Modern Browser");
    setMinimumSize(800, 600);
    resize(1200, 800);
}

Browser::~Browser()
{
}

void Browser::setupUI()
{
    // Central widget
    QWidget *centralWidget = new QWidget(this);
    QVBoxLayout *mainLayout = new QVBoxLayout(centralWidget);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    mainLayout->setSpacing(0);
    
    // Address bar
    addressBar = new AddressBar(this);
    mainLayout->addWidget(addressBar);
    
    // Tab widget
    tabWidget = new TabWidget(this);
    mainLayout->addWidget(tabWidget);
    
    setCentralWidget(centralWidget);
    
    // Download manager
    downloadManager = new DownloadManager(this);
}

void Browser::setupMenuBar()
{
    // File menu
    fileMenu = menuBar()->addMenu("&File");
    
    newTabAction = fileMenu->addAction("New &Tab");
    newTabAction->setShortcut(QKeySequence::AddTab);
    newTabAction->setIcon(QIcon::fromTheme("tab-new"));
    
    closeTabAction = fileMenu->addAction("&Close Tab");
    closeTabAction->setShortcut(QKeySequence::Close);
    
    fileMenu->addSeparator();
    
    openFileAction = fileMenu->addAction("&Open File...");
    openFileAction->setShortcut(QKeySequence::Open);
    
    fileMenu->addSeparator();
    
    exitAction = fileMenu->addAction("E&xit");
    exitAction->setShortcut(QKeySequence::Quit);
    
    // Edit menu
    editMenu = menuBar()->addMenu("&Edit");
    
    QAction *copyAction = editMenu->addAction("&Copy");
    copyAction->setShortcut(QKeySequence::Copy);
    
    QAction *pasteAction = editMenu->addAction("&Paste");
    pasteAction->setShortcut(QKeySequence::Paste);
    
    QAction *selectAllAction = editMenu->addAction("Select &All");
    selectAllAction->setShortcut(QKeySequence::SelectAll);
    
    editMenu->addSeparator();
    
    QAction *findAction = editMenu->addAction("&Find");
    findAction->setShortcut(QKeySequence::Find);
    
    // View menu
    viewMenu = menuBar()->addMenu("&View");
    
    backAction = viewMenu->addAction("&Back");
    backAction->setShortcut(QKeySequence::Back);
    backAction->setIcon(QIcon::fromTheme("go-previous"));
    
    forwardAction = viewMenu->addAction("&Forward");
    forwardAction->setShortcut(QKeySequence::Forward);
    forwardAction->setIcon(QIcon::fromTheme("go-next"));
    
    refreshAction = viewMenu->addAction("&Refresh");
    refreshAction->setShortcut(QKeySequence::Refresh);
    refreshAction->setIcon(QIcon::fromTheme("view-refresh"));
    
    viewMenu->addSeparator();
    
    fullScreenAction = viewMenu->addAction("&Full Screen");
    fullScreenAction->setShortcut(QKeySequence::FullScreen);
    fullScreenAction->setCheckable(true);
    
    viewMenu->addSeparator();
    
    QAction *zoomInAction = viewMenu->addAction("Zoom &In");
    zoomInAction->setShortcut(QKeySequence::ZoomIn);
    
    QAction *zoomOutAction = viewMenu->addAction("Zoom &Out");
    zoomOutAction->setShortcut(QKeySequence::ZoomOut);
    
    QAction *resetZoomAction = viewMenu->addAction("&Reset Zoom");
    resetZoomAction->setShortcut(QKeySequence(Qt::CTRL + Qt::Key_0));
    
    // Bookmarks menu
    QMenu *bookmarksMenu = menuBar()->addMenu("&Bookmarks");
    
    bookmarksAction = bookmarksMenu->addAction("Show &Bookmarks");
    bookmarksAction->setShortcut(QKeySequence(Qt::CTRL + Qt::SHIFT + Qt::Key_B));
    
    bookmarksMenu->addSeparator();
    
    QAction *addBookmarkAction = bookmarksMenu->addAction("&Add Bookmark");
    addBookmarkAction->setShortcut(QKeySequence(Qt::CTRL + Qt::Key_D));
    
    // History menu
    QMenu *historyMenu = menuBar()->addMenu("&History");
    
    historyAction = historyMenu->addAction("Show &History");
    historyAction->setShortcut(QKeySequence(Qt::CTRL + Qt::Key_H));
    
    historyMenu->addSeparator();
    
    QAction *clearHistoryAction = historyMenu->addAction("&Clear History");
    
    // Downloads menu
    QMenu *downloadsMenu = menuBar()->addMenu("&Downloads");
    
    downloadsAction = downloadsMenu->addAction("Show &Downloads");
    downloadsAction->setShortcut(QKeySequence(Qt::CTRL + Qt::Key_J));
    
    // Help menu
    helpMenu = menuBar()->addMenu("&Help");
    
    aboutAction = helpMenu->addAction("&About");
}

void Browser::setupToolBar()
{
    mainToolBar = addToolBar("Main Toolbar");
    mainToolBar->setMovable(false);
    mainToolBar->setIconSize(QSize(24, 24));
    
    mainToolBar->addAction(backAction);
    mainToolBar->addAction(forwardAction);
    mainToolBar->addAction(refreshAction);
    mainToolBar->addAction(newTabAction);
    mainToolBar->addSeparator();
    mainToolBar->addAction(fullScreenAction);
}

void Browser::setupStatusBar()
{
    // Loading progress bar
    loadingProgress = new QProgressBar();
    loadingProgress->setFixedWidth(150);
    loadingProgress->setMaximum(100);
    loadingProgress->setValue(100);
    loadingProgress->setVisible(false);
    
    // Status label
    statusLabel = new QLabel("Ready");
    statusLabel->setAlignment(Qt::AlignLeft);
    
    statusBar()->addWidget(statusLabel, 1);
    statusBar()->addPermanentWidget(loadingProgress);
}

void Browser::setupConnections()
{
    // Address bar connections
    connect(addressBar, &AddressBar::urlSubmitted, this, &Browser::navigateToUrl);
    connect(addressBar, &AddressBar::refreshRequested, this, &Browser::refreshCurrentTab);
    connect(addressBar, &AddressBar::homeRequested, this, [this]() {
        navigateToUrl(QUrl("https://www.google.com"));
    });
    
    // Tab widget connections
    connect(tabWidget, &TabWidget::urlChanged, this, &Browser::updateAddressBar);
    connect(tabWidget, &TabWidget::loadingProgress, this, &Browser::updateLoadingProgress);
    connect(tabWidget, &TabWidget::titleChanged, this, &Browser::updateTitle);
    connect(tabWidget, &TabWidget::downloadRequested, this, &Browser::onDownloadRequested);
    connect(tabWidget, &TabWidget::allTabsClosed, this, [this]() {
        // When all tabs are closed, create a new one
        createNewTab();
    });
    
    // Menu actions
    connect(newTabAction, &QAction::triggered, this, &Browser::createNewTab);
    connect(closeTabAction, &QAction::triggered, this, &Browser::closeCurrentTab);
    connect(openFileAction, &QAction::triggered, this, &Browser::openFile);
    connect(exitAction, &QAction::triggered, qApp, &QApplication::quit);
    connect(backAction, &QAction::triggered, this, &Browser::goBack);
    connect(forwardAction, &QAction::triggered, this, &Browser::goForward);
    connect(refreshAction, &QAction::triggered, this, &Browser::refreshCurrentTab);
    connect(fullScreenAction, &QAction::triggered, this, &Browser::toggleFullScreen);
    connect(bookmarksAction, &QAction::triggered, this, &Browser::showBookmarks);
    connect(historyAction, &QAction::triggered, this, &Browser::showHistory);
    connect(downloadsAction, &QAction::triggered, this, &Browser::showDownloads);
    connect(aboutAction, &QAction::triggered, this, &Browser::aboutBrowser);
    
    // Keyboard shortcuts
    QShortcut *ctrlL = new QShortcut(QKeySequence(Qt::CTRL + Qt::Key_L), this);
    connect(ctrlL, &QShortcut::activated, this, [this]() {
        addressBar->setFocus();
        addressBar->findChild<QLineEdit*>()->selectAll();
    });
    
    QShortcut *f5 = new QShortcut(QKeySequence(Qt::Key_F5), this);
    connect(f5, &QShortcut::activated, this, &Browser::refreshCurrentTab);
    
    QShortcut *f11 = new QShortcut(QKeySequence(Qt::Key_F11), this);
    connect(f11, &QShortcut::activated, this, &Browser::toggleFullScreen);
}

void Browser::loadStyleSheet()
{
    // Modern dark theme stylesheet
    QString styleSheet = R"(
        QMainWindow {
            background-color: #1e1e1e;
        }
        
        QMenuBar {
            background-color: #2d2d2d;
            color: #ffffff;
            padding: 2px;
        }
        
        QMenuBar::item {
            padding: 5px 10px;
            background: transparent;
            border-radius: 3px;
        }
        
        QMenuBar::item:selected {
            background-color: #0078d4;
        }
        
        QMenu {
            background-color: #2d2d2d;
            border: 1px solid #3e3e3e;
            border-radius: 5px;
        }
        
        QMenu::item {
            padding: 8px 25px;
            color: #ffffff;
        }
        
        QMenu::item:selected {
            background-color: #0078d4;
        }
        
        QToolBar {
            background-color: #2d2d2d;
            border: none;
            padding: 5px;
            spacing: 5px;
        }
        
        QToolButton {
            background-color: #3e3e3e;
            border: none;
            border-radius: 5px;
            padding: 5px;
            color: #ffffff;
        }
        
        QToolButton:hover {
            background-color: #4e4e4e;
        }
        
        QToolButton:pressed {
            background-color: #0078d4;
        }
        
        QStatusBar {
            background-color: #2d2d2d;
            color: #ffffff;
            border-top: 1px solid #3e3e3e;
        }
        
        QProgressBar {
            border: none;
            border-radius: 3px;
            text-align: center;
            color: #ffffff;
        }
        
        QProgressBar::chunk {
            background-color: #0078d4;
            border-radius: 3px;
        }
        
        QTabWidget::pane {
            border: none;
            background-color: #1e1e1e;
        }
        
        QTabBar::tab {
            background-color: #2d2d2d;
            color: #ffffff;
            padding: 8px 20px;
            margin-right: 2px;
            border-top-left-radius: 5px;
            border-top-right-radius: 5px;
        }
        
        QTabBar::tab:selected {
            background-color: #1e1e1e;
        }
        
        QTabBar::tab:hover:!selected {
            background-color: #3e3e3e;
        }
    )";
    
    setStyleSheet(styleSheet);
}

void Browser::navigateToUrl(const QUrl &url)
{
    QWebEngineView *webView = tabWidget->currentWebView();
    if (webView) {
        webView->setUrl(url);
        addressBar->setLoading(true);
        statusLabel->setText("Loading...");
    }
}

void Browser::updateAddressBar(const QUrl &url)
{
    addressBar->setUrl(url);
    addressBar->addHistoryEntry(url.toString());
}

void Browser::updateLoadingProgress(int progress)
{
    if (progress < 100) {
        loadingProgress->setVisible(true);
        loadingProgress->setValue(progress);
        statusLabel->setText(QString("Loading: %1%").arg(progress));
        addressBar->setLoading(true);
    } else {
        loadingProgress->setVisible(false);
        loadingProgress->setValue(100);
        statusLabel->setText("Ready");
        addressBar->setLoading(false);
    }
}

void Browser::updateTitle(const QString &title)
{
    QString windowTitle = title.isEmpty() ? "Modern Browser" : title + " - Modern Browser";
    setWindowTitle(windowTitle);
}

void Browser::createNewTab()
{
    QWebEngineView *webView = tabWidget->createNewTab();
    if (webView) {
        // Configure web engine settings for modern features
        QWebEngineSettings *settings = webView->settings();
        settings->setAttribute(QWebEngineSettings::JavascriptEnabled, true);
        settings->setAttribute(QWebEngineSettings::JavascriptCanOpenWindows, true);
        settings->setAttribute(QWebEngineSettings::JavascriptCanAccessClipboard, true);
        settings->setAttribute(QWebEngineSettings::LocalStorageEnabled, true);
        settings->setAttribute(QWebEngineSettings::WebGLEnabled, true);
        settings->setAttribute(QWebEngineSettings::FullScreenSupportEnabled, true);
        settings->setAttribute(QWebEngineSettings::ScreenCaptureEnabled, true);
        settings->setAttribute(QWebEngineSettings::PluginsEnabled, true);
        settings->setAttribute(QWebEngineSettings::AutoLoadImages, true);
        settings->setAttribute(QWebEngineSettings::PlaybackRequiresUserGesture, false);
        
        // Enable modern CSS features
        settings->setAttribute(QWebEngineSettings::CssGridLayoutEnabled, true);
        settings->setAttribute(QWebEngineSettings::SpatialNavigationEnabled, true);
        
        // Navigate to home page
        webView->setUrl(QUrl("https://www.google.com"));
    }
}

void Browser::closeCurrentTab()
{
    int currentIndex = tabWidget->currentIndex();
    if (currentIndex >= 0) {
        tabWidget->closeTab(currentIndex);
    }
}

void Browser::refreshCurrentTab()
{
    QWebEngineView *webView = tabWidget->currentWebView();
    if (webView) {
        webView->reload();
    }
}

void Browser::goBack()
{
    QWebEngineView *webView = tabWidget->currentWebView();
    if (webView && webView->page()->action(QWebEnginePage::Back)->isEnabled()) {
        webView->back();
    }
}

void Browser::goForward()
{
    QWebEngineView *webView = tabWidget->currentWebView();
    if (webView && webView->page()->action(QWebEnginePage::Forward)->isEnabled()) {
        webView->forward();
    }
}

void Browser::toggleFullScreen()
{
    if (isFullScreen()) {
        showNormal();
        menuBar()->setVisible(true);
        mainToolBar->setVisible(true);
        statusBar()->setVisible(true);
        fullScreenAction->setChecked(false);
    } else {
        showFullScreen();
        menuBar()->setVisible(false);
        mainToolBar->setVisible(false);
        statusBar()->setVisible(false);
        fullScreenAction->setChecked(true);
    }
}

void Browser::showBookmarks()
{
    QMessageBox::information(this, "Bookmarks", 
        "Bookmarks feature coming soon!\n\nYou can use Ctrl+D to add bookmarks in future versions.");
}

void Browser::showHistory()
{
    QMessageBox::information(this, "History",
        "History feature coming soon!\n\nYour browsing history will be stored locally.");
}

void Browser::showDownloads()
{
    downloadManager->show();
    downloadManager->raise();
    downloadManager->activateWindow();
}

void Browser::openFile()
{
    QString fileName = QFileDialog::getOpenFileName(this, "Open File", "",
        "HTML Files (*.html *.htm);;All Files (*)");
    
    if (!fileName.isEmpty()) {
        QUrl url = QUrl::fromLocalFile(fileName);
        navigateToUrl(url);
    }
}

void Browser::aboutBrowser()
{
    QMessageBox::about(this, "About Modern Browser",
        "<h2>Modern Browser</h2>"
        "<p>Version 1.0</p>"
        "<p>A modern web browser built with C++ and Qt6.</p>"
        "<p><b>Features:</b></p>"
        "<ul>"
        "<li>Tabbed browsing</li>"
        "<li>Modern web standards support (HTML5, CSS3, JavaScript)</li>"
        "<li>Download manager</li>"
        "<li>Full-screen mode</li>"
        "<li>Dark theme</li>"
        "<li>WebGL support</li>"
        "</ul>"
        "<p>Built with ❤️ using Qt WebEngine</p>");
}

void Browser::onDownloadRequested(QWebEngineDownloadRequest *download)
{
    if (download) {
        downloadManager->addDownload(download);
    }
}
