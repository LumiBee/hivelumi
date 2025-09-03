# 后端 CORS 配置指南

## Spring Boot 后端 CORS 配置

为了允许前端（部署在 Vercel 上）访问阿里云上的后端服务，需要在后端配置 CORS。

### 方法一：全局 CORS 配置（推荐）

在 Spring Boot 主配置类或配置类中添加：

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*") // 允许所有域名，生产环境建议指定具体域名
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

### 方法二：指定具体域名（生产环境推荐）

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                    "https://your-frontend-domain.vercel.app", // Vercel 部署域名
                    "http://localhost:3000", // 本地开发环境
                    "https://your-custom-domain.com" // 自定义域名
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

### 方法三：使用 @CrossOrigin 注解

在控制器类或方法上添加：

```java
@RestController
@CrossOrigin(origins = {
    "https://your-frontend-domain.vercel.app",
    "http://localhost:3000"
}, allowCredentials = "true")
public class YourController {
    // 控制器方法
}
```

### 方法四：Spring Security 配置

如果使用 Spring Security，需要额外配置：

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
            // 其他安全配置...
            ;
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

## 阿里云服务器配置

### 1. 防火墙配置

确保开放后端服务端口（通常是 8090）：

```bash
# 开放端口
sudo ufw allow 8090

# 或者使用 iptables
sudo iptables -A INPUT -p tcp --dport 8090 -j ACCEPT
```

### 2. 安全组配置

在阿里云控制台配置安全组规则：
- 端口：8090
- 协议：TCP
- 授权对象：0.0.0.0/0（或指定IP范围）

### 3. Nginx 反向代理（可选）

如果使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /api/ {
        proxy_pass http://localhost:8090/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS 头
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
        add_header Access-Control-Allow-Credentials true;
        
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Allow-Credentials true;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }
}
```

## 测试 CORS 配置

使用浏览器开发者工具或 curl 测试：

```bash
curl -H "Origin: https://your-frontend-domain.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-aliyun-server.com/api/test
```

## 常见问题

1. **预检请求失败**：确保 OPTIONS 请求被正确处理
2. **凭据问题**：如果使用 cookies，确保 `allowCredentials(true)` 和 `Access-Control-Allow-Credentials: true`
3. **域名不匹配**：确保前端域名在后端 CORS 配置的允许列表中
