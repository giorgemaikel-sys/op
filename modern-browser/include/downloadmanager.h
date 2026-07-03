#ifndef DOWNLOADMANAGER_H
#define DOWNLOADMANAGER_H

#include <QObject>
#include <QDialog>
#include <QListWidget>
#include <QVBoxLayout>
#include <QWebEngineDownloadRequest>
#include <QTimer>
#include <QString>
#include <QUrl>
#include <map>

class DownloadItem : public QWidget
{
    Q_OBJECT

public:
    explicit DownloadItem(const QString &fileName, const QUrl &sourceUrl, 
                         qint64 totalBytes, QWidget *parent = nullptr);
    
    void updateProgress(qint64 receivedBytes, qint64 totalBytes);
    void setCompleted();
    void setCancelled();
    
private:
    QLabel *fileNameLabel;
    QLabel *progressLabel;
    QProgressBar *progressBar;
    QPushButton *cancelButton;
    QPushButton *openButton;
    QVBoxLayout *layout;
    
    qint64 totalSize;
    bool isCompleted;
};

class DownloadManager : public QDialog
{
    Q_OBJECT

public:
    explicit DownloadManager(QWidget *parent = nullptr);
    ~DownloadManager();

    void addDownload(QWebEngineDownloadRequest *download);
    void show();
    int activeDownloads() const;

private slots:
    void onDownloadProgress(qint64 receivedBytes, qint64 totalBytes);
    void onDownloadFinished();
    void onDownloadCancelled();
    void cleanupFinishedDownloads();

private:
    QListWidget *downloadList;
    std::map<QWebEngineDownloadRequest*, DownloadItem*> downloadItems;
    QTimer *cleanupTimer;
    int downloadCount;
};

#endif // DOWNLOADMANAGER_H
