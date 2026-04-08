install:
    pnpm install

dev:
    pnpm dev

test:
    pnpm test

e2e:
    pnpm test:e2e

flaker-local:
    pnpm flaker:run:local

flaker-actrun:
    pnpm flaker:run:actrun

flaker-collect-local:
    pnpm flaker:collect:local

flaker-scheduled:
    pnpm flaker:run:scheduled

vrt:
    pnpm vrt:snapshot

vrt-approve:
    pnpm vrt:approve
