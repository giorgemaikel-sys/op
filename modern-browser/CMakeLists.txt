cmake_minimum_required(VERSION 3.16)
project(ModernBrowser VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

# Find required packages
find_package(Qt6 REQUIRED COMPONENTS Core Gui Widgets WebEngineWidgets Network)

# Source files
set(SOURCES
    src/main.cpp
    src/browser.cpp
    src/tabwidget.cpp
    src/addressbar.cpp
    src/downloadmanager.cpp
)

# Header files
set(HEADERS
    include/browser.h
    include/tabwidget.h
    include/addressbar.h
    include/downloadmanager.h
)

# Create executable
add_executable(${PROJECT_NAME} ${SOURCES} ${HEADERS})

# Include directories
target_include_directories(${PROJECT_NAME} PRIVATE ${CMAKE_SOURCE_DIR}/include)

# Link libraries
target_link_libraries(${PROJECT_NAME} PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
    Qt6::WebEngineWidgets
    Qt6::Network
)

# Install rules
install(TARGETS ${PROJECT_NAME} DESTINATION bin)
