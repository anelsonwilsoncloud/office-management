package com.office.officemanagement;

import com.office.officemanagement.config.ConfigPathInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OfficeManagementApplication {
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(OfficeManagementApplication.class);
        app.addInitializers(new ConfigPathInitializer());
        app.run(args);
    }
}
