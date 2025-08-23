# WhatsApp Sender - Docker Multi-Container Setup

This setup allows you to run multiple WhatsApp sender instances in separate Docker containers, each with its own configuration and session.

## Architecture

- **Single Client per Container**: Each container runs exactly one WhatsApp client
- **Shared Data**: All containers share the same data directories for contacts, templates, and results
- **Independent Sessions**: Each container maintains its own WhatsApp session
- **Scalable**: Easy to add new containers for additional WhatsApp accounts

## Container Structure

```
whatsapp-sender/
├── configs/
│   ├── default.json      # Default account configuration
│   ├── business.json     # Business account configuration
│   └── personal.json     # Personal account configuration
├── data/
│   ├── contacts/         # Shared contact files
│   ├── message-templates/ # Shared message templates
│   ├── sessions/         # Individual session data per client
│   └── results/          # Shared result files
├── docker-compose.yml    # Multi-container orchestration
└── Dockerfile           # Container image definition
```

## Quick Start

### 1. Build and Start All Containers

```bash
# Build and start all containers
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### 2. Start Individual Containers

```bash
# Start only the wa-0 container
docker-compose up -d whatsapp-wa-0

# Start only the wa-1 container
docker-compose up -d whatsapp-wa-1

# Start only the wa-2 container
docker-compose up -d whatsapp-wa-2

# Start only the wa-3 container
docker-compose up -d whatsapp-wa-3
```

### 3. Stop and Remove Containers

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Container Management

### View Running Containers

```bash
docker-compose ps
```

### View Container Logs

```bash
# View logs for specific container
docker-compose logs whatsapp-wa-0
docker-compose logs whatsapp-wa-1
docker-compose logs whatsapp-wa-2
docker-compose logs whatsapp-wa-3

# Follow logs in real-time
docker-compose logs -f whatsapp-wa-0
```

### Restart Containers

```bash
# Restart specific container
docker-compose restart whatsapp-wa-0

# Restart all containers
docker-compose restart
```

## Configuration

### Adding New Containers

1. **Create Configuration File**: Add a new config file in `configs/` directory
2. **Update docker-compose.yml**: Add the new service and config reference
3. **Rebuild and Start**: Run `docker-compose up -d --build`

### Example: Adding a New Container

```yaml
# In docker-compose.yml
whatsapp-wa-4:
  build: .
  container_name: whatsapp-sender-wa-4
  environment:
    - NODE_ENV=production
  volumes:
    - ./data:/app/data
  configs:
    - source: wa_4_config
      target: /app/config.json
  restart: unless-stopped
  networks:
    - whatsapp-network

# In configs section
configs:
  wa_4_config:
    file: ./configs/wa-4.json
```

### Device Configuration

Each container can have unique device profiles to appear as different devices/browsers:

```json
{
  "client": {
    "device": {
      "name": "iPhone 15",
      "browser": "Safari Mobile",
      "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1"
    }
  }
}
```

**Available Device Types:**
- **Desktop**: Windows, macOS, Linux with Chrome, Firefox, Safari
- **Mobile**: iOS, Android with mobile browsers
- **Tablet**: iPad, Android tablets
- **Custom**: Any custom device/browser combination

### Configuration Parameters

Each container can have different settings:

- **Messaging Delays**: Different delay ranges for different use cases
- **Puppeteer Arguments**: Custom browser settings per container
- **Session Timeouts**: Different timeout values
- **Client IDs**: Unique identifiers for each session (wa-0, wa-1, wa-2, wa-3)
- **Device Profiles**: Different device names, browsers, and user agents per container

## Data Management

### Shared Directories

- **Contacts**: All containers share the same contact lists
- **Message Templates**: All containers share the same message templates
- **Results**: All containers write results to the same directory

### Session Isolation

- **Sessions**: Each container has its own session folder (`data/sessions/{clientId}`)
- **Authentication**: Each container maintains its own WhatsApp authentication
- **State**: Each container operates independently

## Monitoring and Troubleshooting

### Health Checks

```bash
# Check container status
docker-compose ps

# Check resource usage
docker stats
```

### Common Issues

1. **Authentication Failed**: Check if the container has been properly initialized
2. **Session Conflicts**: Ensure each container has a unique client ID
3. **Resource Limits**: Monitor memory and CPU usage for multiple containers

### Log Analysis

```bash
# Search for errors across all containers
docker-compose logs | grep -i error

# Search for specific patterns
docker-compose logs | grep "QR Code received"
```

## Scaling Considerations

### Resource Requirements

- **Memory**: Each container typically uses 200-500MB RAM
- **CPU**: Each container uses moderate CPU during message sending
- **Storage**: Session data grows over time, monitor disk usage

### Performance Tips

1. **Stagger Startup**: Start containers with delays to avoid overwhelming WhatsApp
2. **Monitor Limits**: Respect WhatsApp's rate limits across all containers
3. **Load Balancing**: Distribute message sending across containers

## Security

### Container Isolation

- Each container runs in its own namespace
- Shared volumes are read-only where possible
- Network isolation between containers

### Data Protection

- Session data is stored in mounted volumes
- Configuration files can be encrypted if needed
- Access to containers can be restricted

## Backup and Recovery

### Data Backup

```bash
# Backup all data
tar -czf whatsapp-backup-$(date +%Y%m%d).tar.gz data/

# Backup specific container data
docker cp whatsapp-wa-0:/app/data/sessions/wa-0 ./backup-wa-0
```

### Container Recovery

```bash
# Recreate specific container
docker-compose up -d --force-recreate whatsapp-wa-0

# Restore from backup
docker cp ./backup-wa-0 whatsapp-wa-0:/app/data/sessions/wa-0

## Advanced Usage

### Environment-Specific Configurations

```bash
# Use different configs for different environments
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Custom Networks

```bash
# Create custom network for specific containers
docker network create whatsapp-secure
```

### Volume Management

```bash
# Use named volumes for better data management
docker volume create whatsapp-data
```

## Support

For issues or questions:
1. Check container logs: `docker-compose logs [container-name]`
2. Verify configuration files are valid JSON
3. Ensure Docker and Docker Compose are up to date
4. Check system resources and limits
