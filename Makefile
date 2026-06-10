# NeuroSort AI — Build System
# Compiles all C modules into neurosort executable
# Works on Windows (MinGW/MSVC) and Linux/macOS (GCC)

CC = gcc
CFLAGS = -Wall -Wextra -O2 -std=c11
LDFLAGS = -lm

SRC_DIR = src
BUILD_DIR = build

SOURCES = $(SRC_DIR)/main.c \
          $(SRC_DIR)/utils.c \
          $(SRC_DIR)/file_scanner.c \
          $(SRC_DIR)/sorter.c \
          $(SRC_DIR)/bst_avl_indexer.c \
          $(SRC_DIR)/stack_queue.c \
          $(SRC_DIR)/hash_table.c \
          $(SRC_DIR)/search_engine.c \
          $(SRC_DIR)/ai_rule_engine.c \
          $(SRC_DIR)/organizer.c

TARGET = neurosort

ifeq ($(OS),Windows_NT)
    TARGET := $(TARGET).exe
    RM = del /Q
    MKDIR = if not exist $(BUILD_DIR) mkdir $(BUILD_DIR)
else
    RM = rm -f
    MKDIR = mkdir -p $(BUILD_DIR)
endif

all: $(TARGET)

$(TARGET): $(SOURCES)
	$(CC) $(CFLAGS) -o $(TARGET) $(SOURCES) $(LDFLAGS)
	@echo "Build complete: $(TARGET)"

clean:
	$(RM) $(TARGET)
	@echo "Cleaned."

demo: $(TARGET)
	./$(TARGET)

run: $(TARGET)
	@echo "Usage: ./$(TARGET) <source_folder> [output_folder]"

.PHONY: all clean demo run
