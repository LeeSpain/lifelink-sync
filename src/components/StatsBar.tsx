import React, { useEffect, useRef, useState } from 'react';

interface StatItem {
  value: string;
  suffix: string;
  label: string;
}

const stats: StatItem[] = [
  { value: '24', suffix: '/7', label: 'Clara availability' },
  { value: '3', suffix: 's', label: 'Average SOS response' },
  { value: '10', suffix: '+', label: 'Family contacts per account' },
  { value: '99', suffix: '%', label: 'Platform uptime' },
];

const AnimatedCounter = ({ value, suffix }: { value: string; suffix: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const target = parseInt(value);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 1500;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-bold font-poppins text-primary">
      {count}{suffix}
    </div>
  );
};

const StatsBar: React.FC = () => {
  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-2">
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
