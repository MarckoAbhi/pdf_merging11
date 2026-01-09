import { motion } from 'framer-motion';
import { Shield, Users, Heart, Lock, Zap, Globe, Mail, Github } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

const values = [
  {
    icon: Shield,
    title: 'Security First',
    description: 'Your files are processed entirely in your browser. We never upload or store your documents on any server.',
  },
  {
    icon: Zap,
    title: 'Fast & Efficient',
    description: 'Built with modern web technologies to ensure lightning-fast processing of your files.',
  },
  {
    icon: Heart,
    title: 'Free Forever',
    description: 'Our core tools will always be free. No hidden fees, no premium tiers, no catch.',
  },
  {
    icon: Globe,
    title: 'Privacy Focused',
    description: 'No tracking, no analytics that identify you, no data collection. Your privacy is sacred.',
  },
];

const team = [
  {
    name: 'File Security',
    role: 'Our Mission',
    description: 'We believe everyone deserves access to professional-grade file security tools without cost or complexity.',
  },
  {
    name: 'Open Development',
    role: 'Our Approach',
    description: 'We continuously improve our tools based on user feedback and the latest security standards.',
  },
];

const About = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero py-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary text-primary-foreground mb-6 shadow-glow">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              About <span className="text-gradient">PDFProtect</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're on a mission to make file security accessible to everyone. 
              Our tools help you protect, manage, and transform your documents with ease.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-foreground mb-6 text-center">Our Story</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="mb-4">
                  PDFProtect was born from a simple frustration: why should protecting your files require 
                  expensive software or uploading sensitive documents to unknown servers?
                </p>
                <p className="mb-4">
                  We built a solution that processes everything directly in your browser. Your files never 
                  leave your device, giving you complete control over your data privacy.
                </p>
                <p>
                  Whether you need to encrypt confidential documents, unlock a PDF you forgot the password for, 
                  merge multiple files, compress large documents, or convert between formats – we've got you covered. 
                  All for free, with no strings attached.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Values</h2>
            <p className="text-muted-foreground">The principles that guide everything we do</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {team.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <h3 className="text-xl font-bold text-foreground mb-1">{item.name}</h3>
                <p className="text-primary font-medium mb-3">{item.role}</p>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center p-8 rounded-3xl glass"
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">Get in Touch</h2>
            <p className="text-muted-foreground mb-6">
              Have questions, feedback, or suggestions? We'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                 asChild
                 size="lg"
                 className="gap-2 gradient-primary text-primary-foreground"
              >
                <a href="mailto:digitalindia1231@gmail.com">
                   <Mail className="w-5 h-5" />
                   Contact Us
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a
                  href="https://github.com/MarckoAbhi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <Github className="w-5 h-5" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
